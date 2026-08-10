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

    const loan = await prisma.loan.findFirst({
      where: { id, userId },
    })

    if (!loan) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 })
    }

    // If deleting a RELEASED loan, revert its savings effect
    if (loan.status === 'RELEASED' && loan.releasedAt) {
      const releaseMonth = new Date(loan.releasedAt).getMonth() + 1
      const releaseYear = new Date(loan.releasedAt).getFullYear()

      const existingSavings = await prisma.savings.findUnique({
        where: {
          month_year_userId: {
            month: releaseMonth,
            year: releaseYear,
            userId,
          },
        },
      })

      if (existingSavings) {
        if (loan.type === 'GIVEN') {
          // Revert Given release -> Deduct from savings
          await prisma.savings.update({
            where: { id: existingSavings.id },
            data: {
              amount: Math.max(0, existingSavings.amount - loan.amount),
            },
          })
        } else if (loan.type === 'TAKEN') {
          // Revert Taken release -> Add back to savings
          await prisma.savings.update({
            where: { id: existingSavings.id },
            data: {
              amount: {
                increment: loan.amount,
              },
            },
          })
        }
      }
    }

    await prisma.loan.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Loan deleted successfully' })
  } catch (error) {
    console.error('Error deleting loan:', error)
    return NextResponse.json({ error: 'Failed to delete loan' }, { status: 500 })
  }
}
