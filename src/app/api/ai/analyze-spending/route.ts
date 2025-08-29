import { NextRequest, NextResponse } from 'next/server'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { prisma } from '@/lib/prisma'
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

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

    const { month, year, timeframe = 'month' } = await req.json()

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { kindeId: user.id }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    // Determine date range based on timeframe
    let startDate: Date
    let endDate: Date

    if (timeframe === 'month') {
      startDate = new Date(year, month - 1, 1)
      endDate = new Date(year, month, 0, 23, 59, 59, 999)
    } else if (timeframe === 'quarter') {
      const quarterMonth = Math.floor((month - 1) / 3) * 3
      startDate = new Date(year, quarterMonth, 1)
      endDate = new Date(year, quarterMonth + 3, 0, 23, 59, 59, 999)
    } else { // year
      startDate = new Date(year, 0, 1)
      endDate = new Date(year, 11, 31, 23, 59, 59, 999)
    }

    // Fetch expenses for the period
    const expenses = await prisma.expense.findMany({
      where: {
        userId: dbUser.id,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    // Fetch budget for the month
    const budget = await prisma.budget.findUnique({
      where: {
        month_year_userId: {
          month: month,
          year: year,
          userId: dbUser.id
        }
      }
    })

    // Fetch income for the period
    const income = await prisma.income.findMany({
      where: {
        userId: dbUser.id,
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    // Calculate statistics
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)
    const totalIncome = income.reduce((sum, inc) => sum + inc.amount, 0)
    
    // Group expenses by category
    const categoryBreakdown = expenses.reduce((acc, exp) => {
      if (!acc[exp.category]) {
        acc[exp.category] = { total: 0, count: 0, items: [] }
      }
      acc[exp.category].total += exp.amount
      acc[exp.category].count++
      acc[exp.category].items.push({
        description: exp.description,
        amount: exp.amount,
        date: exp.date,
        subcategory: exp.subcategory
      })
      return acc
    }, {} as Record<string, any>)

    // Group expenses by subcategory
    const subcategoryBreakdown = expenses.reduce((acc, exp) => {
      if (exp.subcategory) {
        if (!acc[exp.subcategory]) {
          acc[exp.subcategory] = { total: 0, count: 0 }
        }
        acc[exp.subcategory].total += exp.amount
        acc[exp.subcategory].count++
      }
      return acc
    }, {} as Record<string, any>)

    // Daily spending pattern
    const dailySpending = expenses.reduce((acc, exp) => {
      const day = exp.date.toISOString().split('T')[0]
      if (!acc[day]) {
        acc[day] = 0
      }
      acc[day] += exp.amount
      return acc
    }, {} as Record<string, number>)

    // Find spending trends (high spending days)
    const avgDailySpending = totalExpenses / Object.keys(dailySpending).length
    const highSpendingDays = Object.entries(dailySpending)
      .filter(([_, amount]) => amount > avgDailySpending * 1.5)
      .map(([date, amount]) => ({ date, amount }))

    // Prepare data for AI analysis
    const analysisData = {
      period: `${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`,
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
      savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1) : 0,
      categoryBreakdown: Object.entries(categoryBreakdown).map(([category, data]: [string, any]) => ({
        category,
        total: data.total,
        percentage: ((data.total / totalExpenses) * 100).toFixed(1),
        count: data.count,
        topExpenses: data.items
          .sort((a: any, b: any) => b.amount - a.amount)
          .slice(0, 3)
          .map((item: any) => ({
            description: item.description,
            amount: item.amount,
            subcategory: item.subcategory
          }))
      })),
      topSubcategories: Object.entries(subcategoryBreakdown)
        .sort((a: any, b: any) => b[1].total - a[1].total)
        .slice(0, 5)
        .map(([name, data]: [string, any]) => ({
          name,
          total: data.total,
          count: data.count
        })),
      highSpendingDays: highSpendingDays.slice(0, 5),
      avgDailySpending,
      budget: budget ? {
        needs: budget.needBudget,
        wants: budget.wantBudget,
        selfDevelopment: budget.selfDevelopmentBudget,
        savings: budget.savingsBudget
      } : null
    }

    // Create AI prompt
    const prompt = `Analyze this spending data and provide CONCISE insights:

${JSON.stringify(analysisData, null, 2)}

Provide BRIEF responses using markdown format:

## 1. Financial Health Score
- Score: X/10
- One-line reason

## 2. Spending Patterns
• Pattern 1 (max 10 words)
• Pattern 2 (max 10 words)

## 3. Top Concerns
• Concern 1 (max 15 words)
• Concern 2 (max 15 words)
• Concern 3 (max 15 words)

## 4. Smart Recommendations  
• Action 1 (max 15 words with specific amount)
• Action 2 (max 15 words with specific amount)
• Action 3 (max 15 words with specific amount)

## 5. Positive Points
• Achievement 1 (max 10 words)
• Achievement 2 (max 10 words)

## 6. Next Month Forecast
• Predicted spending: PKR amount
• Key insight (max 10 words)

IMPORTANT: Keep each point VERY SHORT and use bullet points. Include specific numbers but keep text minimal.`

    // Call GROQ AI
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a concise financial advisor AI. Provide VERY BRIEF, bullet-pointed insights. Use markdown format. Keep each point under 15 words. Be specific with numbers but minimal with text. No long explanations."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
      max_tokens: 500,
    })

    const aiAnalysis = completion.choices[0]?.message?.content || "Unable to generate analysis"

    // Store analysis in database (optional - create a new model for this)
    // You could create an AIAnalysis model to store these results

    return NextResponse.json({
      success: true,
      analysis: aiAnalysis,
      statistics: {
        totalIncome,
        totalExpenses,
        netBalance: totalIncome - totalExpenses,
        savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1) : 0,
        categoryBreakdown,
        topSubcategories: Object.entries(subcategoryBreakdown)
          .sort((a: any, b: any) => b[1].total - a[1].total)
          .slice(0, 5),
        avgDailySpending: avgDailySpending.toFixed(0),
        highSpendingDays
      }
    })

  } catch (error) {
    console.error('AI Analysis Error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze spending patterns', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}