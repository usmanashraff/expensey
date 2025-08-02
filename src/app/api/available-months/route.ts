import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId } from '@/lib/auth'

export async function GET() {
  try {
    const userId = await getUserId()
    // Get all unique month/year combinations that have expenses for this user
    const expenses = await prisma.expense.findMany({
      where: { userId },
      select: {
        date: true,
      },
      distinct: ['date'],
    })

    // Extract unique month/year combinations
    const monthYearSet = new Set<string>()
    
    expenses.forEach(expense => {
      const date = new Date(expense.date)
      const month = date.getMonth() + 1
      const year = date.getFullYear()
      monthYearSet.add(`${year}-${month}`)
    })

    // Convert to array of objects and sort
    const availableMonths = Array.from(monthYearSet).map(monthYear => {
      const [year, month] = monthYear.split('-').map(Number)
      return { year, month }
    }).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year
      return b.month - a.month
    })

    return NextResponse.json(availableMonths)
  } catch (error) {
    console.error('Error fetching available months:', error)
    return NextResponse.json({ error: 'Failed to fetch available months' }, { status: 500 })
  }
}