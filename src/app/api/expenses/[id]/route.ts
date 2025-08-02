import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // First get the expense to check if it's a SAVINGS category
    const expense = await prisma.expense.findUnique({
      where: { id },
    })
    
    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }
    
    // Delete the expense
    await prisma.expense.delete({
      where: { id },
    })
    
    // If it was a SAVINGS expense, decrease both monthly and total savings
    if (expense.category === 'SAVINGS') {
      const expenseMonth = new Date(expense.date).getMonth() + 1
      const expenseYear = new Date(expense.date).getFullYear()
      
      // Update monthly savings
      const currentSavings = await prisma.savings.findUnique({
        where: {
          month_year: {
            month: expenseMonth,
            year: expenseYear,
          },
        },
      })
      
      if (currentSavings) {
        await prisma.savings.update({
          where: { id: currentSavings.id },
          data: {
            amount: Math.max(0, currentSavings.amount - expense.amount),
          },
        })
      }
      
      // Total lifetime savings is now calculated automatically from all monthly savings
    }
    
    return NextResponse.json({ message: 'Expense deleted' })
  } catch (error) {
    console.error('Error deleting expense:', error)
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { amount, description, category } = body

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        amount: amount ? parseFloat(amount) : undefined,
        description,
        category,
      },
    })

    return NextResponse.json(expense)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 })
  }
}