import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId } from '@/lib/auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId()
    const { id } = await params
    
    // First get the expense to check if it's a SAVINGS category and belongs to user
    const expense = await prisma.expense.findUnique({
      where: { 
        id,
        userId 
      },
    })
    
    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }
    
    // Delete the expense
    await prisma.expense.delete({
      where: { 
        id,
        userId 
      },
    })
    
    // If it was a SAVINGS expense, decrease both monthly and total savings
    if (expense.category === 'SAVINGS') {
      const expenseMonth = new Date(expense.date).getMonth() + 1
      const expenseYear = new Date(expense.date).getFullYear()
      
      // Update monthly savings
      const currentSavings = await prisma.savings.findUnique({
        where: {
          month_year_userId: {
            month: expenseMonth,
            year: expenseYear,
            userId,
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
    const userId = await getUserId()
    const { id } = await params
    const body = await request.json()
    const { amount, description, category } = body

    const expense = await prisma.expense.update({
      where: { 
        id,
        userId 
      },
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