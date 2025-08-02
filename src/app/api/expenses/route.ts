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
    console.log('Received expense data:', body)
    const { amount, description, category, subcategory, date } = body

    if (!amount || !description || !category || !subcategory) {
      console.log('Missing fields:', { amount: !amount, description: !description, category: !category, subcategory: !subcategory })
      return NextResponse.json(
        { error: 'Missing required fields. Amount, description, category, and utility type are required.' },
        { status: 400 }
      )
    }

    if (!Object.values(ExpenseCategory).includes(category)) {
      console.log('Invalid category:', category, 'Valid categories:', Object.values(ExpenseCategory))
      return NextResponse.json(
        { error: `Invalid category: ${category}. Valid categories are: ${Object.values(ExpenseCategory).join(', ')}` },
        { status: 400 }
      )
    }

    const expenseDate = date ? new Date(date) : new Date()
    
    console.log('Creating expense with data:', {
      amount: parseFloat(amount),
      description,
      category,
      subcategory,
      date: expenseDate,
    })
    
    const expense = await prisma.expense.create({
      data: {
        amount: parseFloat(amount),
        description,
        category,
        subcategory: subcategory || null,
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
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error')
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
    
    return NextResponse.json({ 
      error: 'Failed to create expense',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}