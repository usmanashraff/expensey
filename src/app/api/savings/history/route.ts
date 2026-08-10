import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId } from '@/lib/auth'

export async function GET() {
  try {
    const userId = await getUserId()
    
    // Get all savings records for the current user ordered by year and month
    const savingsHistory = await prisma.savings.findMany({
      where: {
        userId: userId
      },
      orderBy: [
        { year: 'asc' },
        { month: 'asc' }
      ],
    })

    // Get all SAVINGS category expenses for the current user grouped by month/year
    const savingsExpenses = await prisma.expense.findMany({
      where: {
        category: 'SAVINGS',
        userId: userId
      },
      orderBy: {
        date: 'asc'
      }
    })

    // Group expenses by month/year
    const expensesByMonth = savingsExpenses.reduce((acc, expense) => {
      const date = new Date(expense.date)
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`
      acc[key] = (acc[key] || 0) + expense.amount
      return acc
    }, {} as Record<string, number>)

    // Create a comprehensive history including months with only expenses
    const allMonths = new Set<string>()
    
    // Add months from savings records
    savingsHistory.forEach(record => {
      allMonths.add(`${record.year}-${record.month}`)
    })
    
    // Add months from expenses
    Object.keys(expensesByMonth).forEach(key => {
      allMonths.add(key)
    })

    // Convert to sorted array and build complete history
    const sortedMonths = Array.from(allMonths).sort()
    
    const completeHistory = sortedMonths.map(monthKey => {
      const [year, month] = monthKey.split('-').map(Number)
      const savingsRecord = savingsHistory.find(s => s.year === year && s.month === month)
      const monthlyExpenses = expensesByMonth[monthKey] || 0
      
      return {
        month,
        year,
        monthName: new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short' }),
        amount: savingsRecord?.amount || 0,
        monthlyContribution: monthlyExpenses,
        totalSaved: savingsRecord?.amount || monthlyExpenses
      }
    })

    // Get user settings for initial savings baseline
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId }
    })

    // Calculate cumulative savings starting from initialSavings baseline
    let cumulative = userSettings?.initialSavings || 0
    const historyWithCumulative = completeHistory.map(record => {
      cumulative += record.monthlyContribution
      return {
        ...record,
        cumulative
      }
    })

    return NextResponse.json(historyWithCumulative)
  } catch (error) {
    console.error('Error fetching savings history:', error)
    return NextResponse.json({ error: 'Failed to fetch savings history' }, { status: 500 })
  }
}