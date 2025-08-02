import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ExpenseCategory } from '@/generated/prisma'

export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(expenses)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, description, category, date } = body

    if (!amount || !description || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!Object.values(ExpenseCategory).includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      )
    }

    const expenseDate = date ? new Date(date) : new Date()
    
    const expense = await prisma.expense.create({
      data: {
        amount: parseFloat(amount),
        description,
        category,
        date: expenseDate,
      },
    })

    // If category is SAVINGS, update both monthly and total savings
    if (category === 'SAVINGS') {
      const expenseMonth = expenseDate.getMonth() + 1
      const expenseYear = expenseDate.getFullYear()
      
      // Update monthly savings
      await prisma.savings.upsert({
        where: {
          month_year: {
            month: expenseMonth,
            year: expenseYear,
          },
        },
        update: {
          amount: {
            increment: parseFloat(amount),
          },
        },
        create: {
          amount: parseFloat(amount),
          month: expenseMonth,
          year: expenseYear,
        },
      })
      
      // Total lifetime savings is now calculated automatically from all monthly savings
    }

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
  }
}