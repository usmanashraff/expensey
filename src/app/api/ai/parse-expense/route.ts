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

CRITICAL PARSING RULES:
1. DESCRIPTION: Extract ONLY the core expense item, removing filler words like "add", "spent", "for", "on", etc.
   - "add 200 for transport fare" → description: "transport fare"
   - "spent 500 on groceries" → description: "groceries"
   - "bought coffee 350" → description: "coffee"
   - "paid electricity bill 3000" → description: "electricity bill"

2. SUBCATEGORY MATCHING: Find the BEST matching utility from the available list based on keywords:
   - Look for exact or partial matches in utility names
   - "transport fare" → match utility containing "Transport"
   - "coffee" → match utility containing "Food", "Snacks", or "Outside Food"
   - "electricity" → match utility containing "Electric" or "Electricity"
   - If multiple matches, choose the most specific one

Context:
- Default currency is ${defaultCurrency}
- Today's date is ${new Date().toISOString().split('T')[0]}
- Categories must be one of: NEED, WANT, SELF_DEVELOPMENT, SAVINGS

CATEGORIZATION RULES (MUST BE FOLLOWED STRICTLY):

NEED (Essential for survival and basic functioning):
- Transportation: transport, fare, bus, metro, train, taxi, uber, rickshaw, fuel, commute, petrol, diesel
- Groceries/Food: groceries, vegetables, fruits, milk, bread, rice, wheat, eggs, meat, fish, market
- Utilities: electricity, gas, water, internet, phone, wifi, mobile recharge
- Housing: rent, maintenance, property tax, home repairs
- Healthcare: medicine, doctor, hospital, clinic, pharmacy, medical
- Family Support: sent home, family, parents, support
- Essential Items: toiletries, soap, shampoo, toothpaste, cleaning supplies

WANT (Non-essential/discretionary):
- Dining Out: restaurant, cafe, coffee shop, starbucks, pizza, burger, fast food, dining, lunch out, dinner out
- Entertainment: movie, cinema, netflix, spotify, gaming, concert, sports
- Shopping: clothes (non-essential), shoes, accessories, gadgets, electronics
- Social: party, gifts, celebration, outing with friends

SELF_DEVELOPMENT:
- Fitness: gym, yoga, sports, fitness, workout, training
- Education: course, class, book, learning, certification, workshop
- Skills: music lessons, art class, language learning

SAVINGS:
- Any mention of savings, investment, deposit, mutual fund

KEYWORD-BASED CATEGORY ENFORCEMENT:
Transport keywords → ALWAYS NEED:
- transport, fare, bus, metro, train, commute, taxi, uber, ola, rickshaw, auto, fuel, petrol, diesel, cab

Food/Grocery keywords → ALWAYS NEED:
- groceries, vegetables, fruits, market, sabzi, dal, rice, wheat, milk, eggs

Restaurant/Cafe keywords → ALWAYS WANT:
- restaurant, cafe, coffee (at shop), starbucks, pizza, burger, dining out, lunch out, dinner out, zomato, swiggy

Utility keywords → ALWAYS NEED:
- electricity, electric, gas, water, internet, wifi, phone, mobile, recharge, bill

Gym/Fitness keywords → ALWAYS SELF_DEVELOPMENT:
- gym, fitness, yoga, workout, training, sports

UTILITY MATCHING ALGORITHM:
1. Extract main expense keyword from description
2. Find utility that contains this keyword (case-insensitive)
3. Priority order for matching:
   - Exact match
   - Contains match (utility contains keyword)
   - Keyword contains utility name
   - Semantic similarity
4. Common mappings:
   - transport/fare/bus/metro → "Transport" or "Public Transport"
   - groceries/vegetables/fruits → "Groceries"
   - restaurant/cafe/coffee → "Outside Food" or "Food & Dining"
   - electricity/electric → "Electricity"
   - gas → "Gas"
   - internet/wifi → "Internet"
   - sent home/family → "Sent home" or "Family Support"

Extract and return a JSON array with this structure:
{
  "expenses": [
    {
      "amount": number,
      "description": "string (cleaned, concise description WITHOUT filler words)",
      "category": "NEED|WANT|SELF_DEVELOPMENT|SAVINGS",
      "subcategory": "string or null (MUST match from available utilities)",
      "date": "YYYY-MM-DD",
      "currency": "${defaultCurrency}"
    }
  ],
  "interpretation": "Brief explanation",
  "suggestions": []
}

EXAMPLES WITH CORRECT PARSING:
- "add 200 for transport fare" → description: "transport fare", category: NEED, subcategory: (match "Transport")
- "spent 500 on groceries" → description: "groceries", category: NEED, subcategory: (match "Groceries")
- "coffee at starbucks 350" → description: "coffee at starbucks", category: WANT, subcategory: (match "Outside Food")
- "paid electricity bill 3000" → description: "electricity bill", category: NEED, subcategory: (match "Electricity")
- "gym membership 2000" → description: "gym membership", category: SELF_DEVELOPMENT, subcategory: (match "Gym")

Return ONLY valid JSON.`

    // Call GROQ AI
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an expert expense parser AI. Your STRICT rules:

1. CLEAN DESCRIPTIONS: Remove ALL filler words ("add", "spent", "for", "on", "paid", "bought"). Keep ONLY the core expense item.
   - "add 200 for transport fare" → "transport fare"
   - "spent 500 on groceries" → "groceries"
   - "bought coffee 350" → "coffee"

2. STRICT CATEGORIZATION:
   NEED: transport, fare, bus, metro, groceries, vegetables, fruits, electricity, gas, water, internet, rent, medicine, family support
   WANT: restaurant, cafe, coffee shop, starbucks, pizza, burger, movie, netflix, shopping (non-essential)
   SELF_DEVELOPMENT: gym, fitness, yoga, course, book (educational), certification
   SAVINGS: savings, investment, deposit

3. TRANSPORT IS ALWAYS NEED: Any mention of transport/fare/bus/metro/taxi MUST be categorized as NEED.

4. RESTAURANT/CAFE IS ALWAYS WANT: Coffee shops, restaurants, dining out are ALWAYS WANT.

5. UTILITY MATCHING: Match subcategory to the BEST available utility type based on keywords.

Return ONLY valid JSON with cleaned descriptions and correct categories.`
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
      // Enhanced categorization validation
      const descriptionLower = (expense.description || '').toLowerCase()
      const textLower = text.toLowerCase()
      
      // Define comprehensive keyword lists for each category
      const needKeywords = [
        'transport', 'fare', 'bus', 'metro', 'train', 'commute', 'taxi', 'uber', 'ola', 'rickshaw', 'auto', 'fuel', 'petrol', 'diesel', 'cab',
        'groceries', 'vegetables', 'fruits', 'market', 'sabzi', 'dal', 'rice', 'wheat', 'milk', 'eggs', 'bread',
        'electricity', 'electric', 'gas', 'water', 'internet', 'wifi', 'phone', 'mobile', 'recharge', 'bill',
        'rent', 'maintenance', 'medicine', 'doctor', 'hospital', 'pharmacy', 'medical',
        'sent home', 'family support', 'parents'
      ]
      
      const wantKeywords = [
        'restaurant', 'cafe', 'coffee shop', 'starbucks', 'pizza', 'burger', 'fast food', 'dining out', 
        'lunch out', 'dinner out', 'zomato', 'swiggy', 'takeout', 'delivery',
        'movie', 'cinema', 'netflix', 'spotify', 'gaming', 'entertainment', 'concert',
        'shopping', 'clothes', 'shoes', 'accessories', 'gadgets', 'party', 'gifts'
      ]
      
      const selfDevKeywords = [
        'gym', 'fitness', 'yoga', 'workout', 'training', 'sports', 'exercise',
        'course', 'class', 'book', 'learning', 'certification', 'workshop', 'education',
        'skill', 'music lesson', 'art class', 'language'
      ]
      
      const savingsKeywords = ['savings', 'investment', 'deposit', 'mutual fund', 'fixed deposit']
      
      // Validate and potentially correct the category
      const validCategories = ['NEED', 'WANT', 'SELF_DEVELOPMENT', 'SAVINGS']
      let category = validCategories.includes(expense.category) ? expense.category : 'WANT'
      
      // Force correct categorization based on keywords
      const hasNeedKeyword = needKeywords.some(k => descriptionLower.includes(k) || textLower.includes(k))
      const hasWantKeyword = wantKeywords.some(k => descriptionLower.includes(k) || textLower.includes(k))
      const hasSelfDevKeyword = selfDevKeywords.some(k => descriptionLower.includes(k) || textLower.includes(k))
      const hasSavingsKeyword = savingsKeywords.some(k => descriptionLower.includes(k) || textLower.includes(k))
      
      // Priority-based category correction
      if (hasSavingsKeyword) {
        category = 'SAVINGS'
      } else if (hasSelfDevKeyword && !hasNeedKeyword) {
        category = 'SELF_DEVELOPMENT'
      } else if (hasNeedKeyword && !hasWantKeyword) {
        category = 'NEED'
      } else if (hasWantKeyword && !hasNeedKeyword) {
        category = 'WANT'
      }
      
      // Special rules for common misclassifications
      if (descriptionLower.includes('transport') || descriptionLower.includes('fare') || 
          descriptionLower.includes('bus') || descriptionLower.includes('metro')) {
        category = 'NEED'
      }
      if (descriptionLower.includes('coffee') && (descriptionLower.includes('shop') || 
          descriptionLower.includes('starbucks') || descriptionLower.includes('cafe'))) {
        category = 'WANT'
      }
      
      // Clean the description - remove common filler words
      let cleanDescription = expense.description || ''
      const fillerWords = ['add', 'added', 'spent', 'spend', 'for', 'on', 'paid', 'bought', 'buy', 'purchase']
      fillerWords.forEach(word => {
        const regex = new RegExp(`^${word}\\s+|\\s+${word}\\s+|\\s+${word}$`, 'gi')
        cleanDescription = cleanDescription.replace(regex, ' ').trim()
      })
      
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
      
      // Enhanced subcategory matching
      let subcategory = null
      
      if (expense.subcategory && utilities.length > 0) {
        // First try exact match
        if (utilities.includes(expense.subcategory)) {
          subcategory = expense.subcategory
        } else {
          // Try various matching strategies
          const match = utilities.find((u: string) => {
            const utilLower = u.toLowerCase()
            const subLower = expense.subcategory.toLowerCase()
            
            // Exact match (case-insensitive)
            if (utilLower === subLower) return true
            
            // Contains match
            if (utilLower.includes(subLower) || subLower.includes(utilLower)) return true
            
            // Word boundary match
            const words = subLower.split(/\s+/)
            return words.some(word => utilLower.includes(word))
          })
          subcategory = match || null
        }
      }
      
      // Smart keyword-based utility matching if no subcategory found
      if (!subcategory && category !== 'SAVINGS' && utilities.length > 0) {
        const descLower = cleanDescription.toLowerCase()
        
        // Enhanced keyword mappings with priority
        const utilityMappings = [
          { priority: 1, keywords: ['transport', 'fare', 'bus', 'metro', 'train', 'taxi', 'uber', 'ola', 'rickshaw', 'auto', 'cab'], utilityPatterns: ['transport', 'commute', 'travel', 'public transport'] },
          { priority: 1, keywords: ['groceries', 'vegetables', 'fruits', 'sabzi', 'market'], utilityPatterns: ['groceries', 'grocery', 'vegetables', 'market'] },
          { priority: 1, keywords: ['electricity', 'electric', 'power'], utilityPatterns: ['electric', 'electricity', 'power'] },
          { priority: 1, keywords: ['gas', 'lpg', 'cylinder'], utilityPatterns: ['gas', 'lpg'] },
          { priority: 1, keywords: ['water', 'water bill'], utilityPatterns: ['water'] },
          { priority: 1, keywords: ['internet', 'wifi', 'broadband'], utilityPatterns: ['internet', 'wifi', 'broadband'] },
          { priority: 1, keywords: ['phone', 'mobile', 'cellular', 'recharge'], utilityPatterns: ['phone', 'mobile', 'recharge'] },
          { priority: 2, keywords: ['restaurant', 'cafe', 'coffee', 'dining', 'food'], utilityPatterns: ['outside food', 'food', 'dining', 'snacks'] },
          { priority: 2, keywords: ['gym', 'fitness', 'workout'], utilityPatterns: ['gym', 'fitness', 'health'] },
          { priority: 2, keywords: ['medical', 'doctor', 'medicine', 'hospital', 'pharmacy'], utilityPatterns: ['medical', 'health', 'medicine', 'healthcare'] },
          { priority: 2, keywords: ['sent', 'home', 'family', 'parents'], utilityPatterns: ['sent home', 'family', 'support'] },
          { priority: 3, keywords: ['rent', 'house rent', 'room rent'], utilityPatterns: ['rent', 'housing'] },
          { priority: 3, keywords: ['entertainment', 'movie', 'netflix'], utilityPatterns: ['entertainment', 'leisure'] }
        ]
        
        // Sort by priority and try to match
        utilityMappings.sort((a, b) => a.priority - b.priority)
        
        for (const mapping of utilityMappings) {
          const hasKeyword = mapping.keywords.some(k => descLower.includes(k) || textLower.includes(k))
          if (hasKeyword) {
            const matchedUtility = utilities.find((u: string) => {
              const utilLower = u.toLowerCase()
              return mapping.utilityPatterns.some(pattern => utilLower.includes(pattern))
            })
            if (matchedUtility) {
              subcategory = matchedUtility
              console.log(`Matched utility "${matchedUtility}" for description "${cleanDescription}"`)
              break
            }
          }
        }
        
        // If still no match, try to find the most relevant utility based on the description
        if (!subcategory) {
          // Extract key words from description
          const words = cleanDescription.toLowerCase().split(/\s+/)
          let bestMatch = null
          let bestScore = 0
          
          for (const utility of utilities) {
            const utilLower = utility.toLowerCase()
            let score = 0
            
            // Check how many words from description match the utility
            for (const word of words) {
              if (word.length > 2 && utilLower.includes(word)) {
                score += word.length // Longer words get more weight
              }
            }
            
            if (score > bestScore) {
              bestScore = score
              bestMatch = utility
            }
          }
          
          if (bestScore > 0) {
            subcategory = bestMatch
          } else {
            // Last resort: look for default utilities
            const defaults = ['Other', 'Miscellaneous', 'General', 'Personal']
            const defaultMatch = utilities.find((u: string) => 
              defaults.some(d => u.toLowerCase().includes(d.toLowerCase()))
            )
            subcategory = defaultMatch || null
          }
        }
      }
      
      return {
        amount: Math.abs(parseFloat(expense.amount) || 0),
        description: cleanDescription.substring(0, 200) || 'Expense',
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