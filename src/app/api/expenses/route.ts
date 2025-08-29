import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ExpenseCategory } from '@/generated/prisma'
import { getUserId } from '@/lib/auth'

export async function GET() {
  try {
    const userId = await getUserId()
    
    const expenses = await prisma.expense.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(expenses)
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId()
    
    // Log request size
    const contentLength = request.headers.get('content-length')
    console.log('Request content-length:', contentLength)
    
    const body = await request.json()
    console.log('Received expense data (without receipt):', {
      amount: body.amount,
      description: body.description,
      category: body.category,
      subcategory: body.subcategory,
      date: body.date,
      currency: body.currency,
      hasReceipt: !!body.receipt,
      receiptSize: body.receipt ? body.receipt.length : 0
    })
    
    const { amount, description, category, subcategory, date, currency, receipt, receipts } = body

    if (!amount || !description || !category) {
      console.log('Missing fields:', { amount: !amount, description: !description, category: !category })
      return NextResponse.json(
        { error: 'Missing required fields. Amount, description, and category are required.' },
        { status: 400 }
      )
    }

    // Utility type (subcategory) is required for all categories except SAVINGS
    // However, we'll be lenient and allow null subcategory with a warning
    if (category !== 'SAVINGS' && !subcategory) {
      console.warn('Missing utility type for non-SAVINGS category, proceeding with null subcategory')
      // Don't return error, just log warning and continue
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
      userId,
      currency: currency || 'PKR',
      hasReceipt: !!receipt,
      receiptSize: receipt ? receipt.length : 0
    })
    
    const expense = await prisma.expense.create({
      data: {
        amount: parseFloat(amount),
        description,
        category,
        subcategory: subcategory || null,
        date: expenseDate,
        userId,
        currency: currency || 'PKR',
        receipt: receipt || null,
        receipts: receipts || [],
      },
    })

    // If category is SAVINGS, update both monthly and total savings
    if (category === 'SAVINGS') {
      const expenseMonth = expenseDate.getMonth() + 1
      const expenseYear = expenseDate.getFullYear()
      
      // Update monthly savings
      await prisma.savings.upsert({
        where: {
          month_year_userId: {
            month: expenseMonth,
            year: expenseYear,
            userId,
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
          userId,
          currency: currency || 'PKR',
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