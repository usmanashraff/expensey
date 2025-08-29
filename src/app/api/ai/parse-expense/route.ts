import { NextRequest, NextResponse } from 'next/server'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { prisma } from '@/lib/prisma'
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

// Define the expected structure for parsed expense
interface ParsedExpense {
  amount: number
  description: string
  category: 'NEED' | 'WANT' | 'SELF_DEVELOPMENT' | 'SAVINGS'
  subcategory?: string
  date?: string
  currency?: string
}

export async function POST(req: NextRequest) {
  try {
    const { isAuthenticated, getUser } = getKindeServerSession()
    if (!isAuthenticated()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { text, utilities = [] } = await req.json()

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 })
    }

    // Get user from database for default settings
    const dbUser = await prisma.user.findUnique({
      where: { kindeId: user.id }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    // Get user settings for default currency
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId: dbUser.id }
    })

    const defaultCurrency = userSettings?.defaultCurrency || 'PKR'

    // Create a comprehensive prompt for the AI
    const prompt = `Parse the following natural language text and extract expense information.

Text: "${text}"

Available utility types for subcategory field (YOU MUST USE ONE OF THESE): [${utilities.map((u: string) => `"${u}"`).join(', ')}]

CRITICAL SUBCATEGORY MATCHING RULES:
1. You MUST select a subcategory from the available list above
2. Match based on keywords in the expense description:
   - "transport", "bus", "fare", "taxi", "uber", "fuel" → Select utility containing "Transport" 
   - "food", "lunch", "dinner", "restaurant", "coffee" → Select utility containing "Food" or "Snacks"
   - "medical", "doctor", "medicine", "hospital" → Select utility containing "Medical" or "Health"
   - "sent home", "family" → Select utility containing "Sent" or "Family"
   - "groceries", "vegetables", "fruits" → Select utility containing "Groceries" or specific food items
   - "electricity", "gas", "water", "internet" → Select utility containing these words
3. If multiple utilities match, choose the most specific one
4. Only use null if category is SAVINGS

Context:
- Default currency is ${defaultCurrency}
- Today's date is ${new Date().toISOString().split('T')[0]}
- Categories must be one of: NEED, WANT, SELF_DEVELOPMENT, SAVINGS

CRITICAL categorization rules - BE VERY CAREFUL AND ACCURATE:

NEED (Essential expenses that are necessary for survival and basic functioning):
- Housing: rent, mortgage, property tax, home insurance
- Utilities: electricity, gas, water, sewage, trash, internet (basic plan), phone (basic plan)
- Food/Groceries: essential groceries, basic food items (NOT restaurants or fancy foods)
- Transportation: public transport, bus fare, train tickets, metro, fuel for work commute, basic car maintenance, car insurance
- Healthcare: medical bills, prescriptions, health insurance, doctor visits
- Family obligations: sending money home, child support, elderly care
- Basic clothing: work clothes, essential clothing items
- Essential home items: basic toiletries, cleaning supplies

WANT (Non-essential discretionary spending for pleasure/comfort):
- Dining out: restaurants, cafes, fast food, coffee shops, food delivery, takeout
- Entertainment: movies, concerts, streaming services, games, sports events
- Shopping: non-essential clothing, accessories, gadgets, electronics for fun
- Hobbies: hobby supplies, recreational activities
- Travel: vacations, leisure trips, hotels for vacation
- Luxury items: expensive brands, premium products, upgrades
- Social: parties, gifts (non-obligatory), social outings
- Convenience: premium internet/phone plans, subscription boxes, apps

SELF_DEVELOPMENT (Investments in personal growth and skills):
- Education: courses, workshops, certifications, tuition, online learning platforms
- Books: educational books, skill development books, professional literature
- Fitness: gym membership, yoga classes, sports training, personal trainer
- Professional development: conferences, seminars, networking events
- Skills: language learning, coding bootcamps, art classes, music lessons
- Mental health: therapy, counseling, meditation apps, self-improvement programs
- Career tools: professional software, tools for skill building

SAVINGS (Money set aside for future):
- Bank savings deposits
- Investment contributions
- Emergency fund additions
- Retirement contributions
- Fixed deposits
- Mutual funds or stocks

EXTREMELY IMPORTANT CATEGORIZATION RULES:
1. ANY mention of "transport", "fare", "bus", "metro", "train", "commute", "taxi", "uber" (for work), "rickshaw", "fuel" → ALWAYS NEED
2. "coffee", "starbucks", "restaurant", "pizza", "dining" → ALWAYS WANT
3. "groceries", "vegetables", "market", "food shopping" → ALWAYS NEED
4. "gym", "fitness", "training", "yoga" → ALWAYS SELF_DEVELOPMENT
5. "movie", "netflix", "gaming", "entertainment" → ALWAYS WANT
6. "course", "learning", "book" (educational), "certification" → ALWAYS SELF_DEVELOPMENT
7. "sending home", "family support", "sent money home" → ALWAYS NEED

SPECIAL RULE FOR TRANSPORT: If the text contains ANY of these words: transport, fare, bus, metro, commute, train, public transport - it MUST be categorized as NEED, never as WANT.

For subcategory: Look for exact matches in available utility types. Common mappings:
- "transport" text → look for "Transport" or "Public Transport" in utilities
- "outside food" → look for "Outside Food, Snacks" or similar
- "sent home" → look for "Sent home" or "Family Support"
- If no utility type matches, suggest creating one or use "Other" if available
- For NEED expenses without clear utility: suggest "General Expenses" or "Miscellaneous"
- For WANT expenses without clear utility: suggest "Personal" or "Miscellaneous"

Extract and return a JSON array of expenses with this structure:
{
  "expenses": [
    {
      "amount": number (extract the amount, default to 0 if unclear),
      "description": "string (clear, concise description)",
      "category": "NEED|WANT|SELF_DEVELOPMENT|SAVINGS",
      "subcategory": "string or null (match from available utilities if applicable)",
      "date": "YYYY-MM-DD format (default to today if not specified)",
      "currency": "${defaultCurrency} (unless another currency is mentioned)"
    }
  ],
  "interpretation": "Brief explanation of what was understood",
  "suggestions": ["Any clarifications needed or suggestions"]
}

Examples - ALWAYS include subcategory from available list:
- "Spent 500 on groceries" -> category: NEED, subcategory: (match "Groceries" from list)
- "Transport fare 200" -> category: NEED, subcategory: (match "Transport" or "Public Transport" from list)
- "Bus ticket 50" -> category: NEED, subcategory: (match "Transport" from list)
- "Gym membership 2000" -> category: SELF_DEVELOPMENT, subcategory: (match "Gym" or "Fitness" from list)
- "Coffee at starbucks 350" -> category: WANT, subcategory: (match "Outside Food" or "Food" from list)
- "Sent home 30000" -> category: NEED, subcategory: (match "Sent home" or "Family" from list)
- "Movie tickets 1200" -> category: WANT, subcategory: (match "Entertainment" from list)
- "Vegetables 300" -> category: NEED, subcategory: (match "Groceries" or "Vegetables" from list)
- "Restaurant dinner 1500" -> category: WANT, subcategory: (match "Outside Food" from list)
- "Electricity bill 3000" -> category: NEED, subcategory: (match "Electricity" or "Electric" from list)

REMEMBER: Always select subcategory from the provided utility types list!

Return ONLY valid JSON, no additional text.`

    // Call GROQ AI
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an expert expense categorization AI with deep understanding of personal finance. Your primary job is to:
1. Extract expense amounts and descriptions accurately
2. CATEGORIZE EXPENSES CORRECTLY based on their actual purpose:
   - NEED: Essential for survival/basic functioning (transport, groceries, utilities, rent, family support)
   - WANT: Discretionary/pleasure spending (restaurants, entertainment, non-essential shopping)
   - SELF_DEVELOPMENT: Personal growth investments (education, gym, courses, books for learning)
   - SAVINGS: Money being saved or invested
3. Use context clues - "transport", "bus", "fare", "commute" are ALWAYS NEED, not WANT
4. Be strict about categories - coffee shops and restaurants are WANT, not NEED
5. Return ONLY valid JSON, no explanations outside the JSON structure`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,  // Lower temperature for more consistent categorization
      max_tokens: 500,
    })

    const aiResponse = completion.choices[0]?.message?.content || "{}"
    
    // Parse the AI response
    let parsedData
    try {
      parsedData = JSON.parse(aiResponse)
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse)
      
      // Try to extract amount and description manually as fallback
      const amountMatch = text.match(/\d+\.?\d*/)
      const amount = amountMatch ? parseFloat(amountMatch[0]) : 0
      
      parsedData = {
        expenses: [{
          amount,
          description: text.replace(/\d+\.?\d*/g, '').trim() || 'Expense',
          category: 'WANT',
          date: new Date().toISOString().split('T')[0],
          currency: defaultCurrency
        }],
        interpretation: "Basic parsing applied",
        suggestions: ["Please provide more details for better categorization"]
      }
    }

    // Validate and clean the parsed expenses
    const validatedExpenses = parsedData.expenses?.map((expense: any) => {
      // Double-check transport categorization
      const transportKeywords = ['transport', 'fare', 'bus', 'metro', 'train', 'commute', 'taxi', 'uber', 'rickshaw', 'public transport']
      const descriptionLower = (expense.description || '').toLowerCase()
      const textLower = text.toLowerCase()
      
      // Force NEED category for transport-related expenses
      const isTransport = transportKeywords.some(keyword => 
        descriptionLower.includes(keyword) || textLower.includes(keyword)
      )
      
      // Ensure category is valid
      const validCategories = ['NEED', 'WANT', 'SELF_DEVELOPMENT', 'SAVINGS']
      let category = validCategories.includes(expense.category) ? expense.category : 'WANT'
      
      // Override category if it's transport but miscategorized
      if (isTransport && category === 'WANT') {
        category = 'NEED'
      }
      
      // Ensure date is valid
      let date = expense.date || new Date().toISOString().split('T')[0]
      
      // Handle relative dates
      if (typeof date === 'string') {
        if (date.toLowerCase() === 'yesterday') {
          const yesterday = new Date()
          yesterday.setDate(yesterday.getDate() - 1)
          date = yesterday.toISOString().split('T')[0]
        } else if (date.toLowerCase() === 'today') {
          date = new Date().toISOString().split('T')[0]
        }
      }
      
      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        date = new Date().toISOString().split('T')[0]
      }
      
      // Clean and validate subcategory - try multiple matching strategies
      let subcategory = null
      
      if (expense.subcategory) {
        // First try exact match
        if (utilities.includes(expense.subcategory)) {
          subcategory = expense.subcategory
        } else {
          // Try case-insensitive match
          const match = utilities.find((u: string) => 
            u.toLowerCase() === expense.subcategory.toLowerCase() ||
            u.toLowerCase().includes(expense.subcategory.toLowerCase()) ||
            expense.subcategory.toLowerCase().includes(u.toLowerCase())
          )
          subcategory = match || null
        }
      }
      
      // If no subcategory found and category requires one, try keyword-based matching
      if (!subcategory && category !== 'SAVINGS') {
        const descLower = (expense.description || '').toLowerCase()
        const textLower = text.toLowerCase()
        
        // Define keyword mappings
        const keywordMappings = [
          { keywords: ['transport', 'bus', 'fare', 'taxi', 'uber', 'metro', 'train', 'fuel', 'commute'], utilityKeywords: ['transport', 'commute', 'travel'] },
          { keywords: ['food', 'lunch', 'dinner', 'breakfast', 'restaurant', 'coffee', 'snack', 'eat'], utilityKeywords: ['food', 'snack', 'meal'] },
          { keywords: ['medical', 'doctor', 'medicine', 'hospital', 'clinic', 'health'], utilityKeywords: ['medical', 'health', 'medicine'] },
          { keywords: ['sent', 'home', 'family', 'transfer'], utilityKeywords: ['sent', 'family', 'home'] },
          { keywords: ['grocery', 'groceries', 'vegetables', 'fruits', 'market'], utilityKeywords: ['grocery', 'groceries', 'market'] },
          { keywords: ['electricity', 'electric', 'power'], utilityKeywords: ['electric', 'electricity', 'power'] },
          { keywords: ['gas', 'lpg'], utilityKeywords: ['gas'] },
          { keywords: ['water'], utilityKeywords: ['water'] },
          { keywords: ['internet', 'wifi', 'broadband'], utilityKeywords: ['internet', 'wifi'] },
          { keywords: ['phone', 'mobile', 'cellular'], utilityKeywords: ['phone', 'mobile'] },
        ]
        
        // Try to find a matching utility based on keywords
        for (const mapping of keywordMappings) {
          const hasKeyword = mapping.keywords.some(k => descLower.includes(k) || textLower.includes(k))
          if (hasKeyword) {
            const matchedUtility = utilities.find((u: string) => 
              mapping.utilityKeywords.some(uk => u.toLowerCase().includes(uk))
            )
            if (matchedUtility) {
              subcategory = matchedUtility
              console.log(`Matched utility "${matchedUtility}" based on keywords`)
              break
            }
          }
        }
        
        // If still no match, look for common default utility types
        if (!subcategory) {
          const defaults = ['Other', 'Miscellaneous', 'General', 'Personal']
          const defaultMatch = utilities.find((u: string) => 
            defaults.some(d => u.toLowerCase().includes(d.toLowerCase()))
          )
          subcategory = defaultMatch || null
        }
      }
      
      return {
        amount: Math.abs(parseFloat(expense.amount) || 0),
        description: expense.description?.substring(0, 200) || 'Expense',
        category,
        subcategory,
        date,
        currency: expense.currency || defaultCurrency
      }
    }).filter((expense: any) => expense.amount > 0) || []

    // Check if any expenses don't have subcategories
    const expensesWithoutSubcategory = validatedExpenses.filter((exp: any) => 
      exp.category !== 'SAVINGS' && !exp.subcategory
    )
    
    // Add suggestions for missing subcategories
    const additionalSuggestions = []
    if (expensesWithoutSubcategory.length > 0) {
      additionalSuggestions.push(
        `Consider adding utility types for better tracking. Some expenses couldn't be matched to existing utilities.`
      )
    }
    
    return NextResponse.json({
      success: true,
      expenses: validatedExpenses,
      interpretation: parsedData.interpretation || "Successfully parsed expense(s)",
      suggestions: [...(parsedData.suggestions || []), ...additionalSuggestions],
      originalText: text,
      missingUtilities: expensesWithoutSubcategory.map((exp: any) => exp.description)
    })

  } catch (error) {
    console.error('Natural Language Parsing Error:', error)
    return NextResponse.json(
      { error: 'Failed to parse expense', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}