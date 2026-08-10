import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId } from '@/lib/auth'

export async function POST(
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

    if (loan.status === 'RELEASED') {
      return NextResponse.json({ error: 'Loan is already released' }, { status: 400 })
    }

    const releaseDate = new Date()
    const releaseMonth = releaseDate.getMonth() + 1
    const releaseYear = releaseDate.getFullYear()

    // Update loan status to RELEASED
    const updatedLoan = await prisma.loan.update({
      where: { id },
      data: {
        status: 'RELEASED',
        releasedAt: releaseDate,
      },
    })

    // Update monthly savings based on loan type
    if (loan.type === 'GIVEN') {
      // Given loan released (repaid back to user) -> ADD to savings
      await prisma.savings.upsert({
        where: {
          month_year_userId: {
            month: releaseMonth,
            year: releaseYear,
            userId,
          },
        },
        update: {
          amount: {
            increment: loan.amount,
          },
        },
        create: {
          amount: loan.amount,
          month: releaseMonth,
          year: releaseYear,
          userId,
          currency: loan.currency || 'PKR',
        },
      })
    } else if (loan.type === 'TAKEN') {
      // Taken loan released (repaid by user to lender) -> DEDUCT from savings
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
        await prisma.savings.update({
          where: { id: existingSavings.id },
          data: {
            amount: Math.max(0, existingSavings.amount - loan.amount),
          },
        })
      } else {
        await prisma.savings.create({
          data: {
            amount: 0,
            month: releaseMonth,
            year: releaseYear,
            userId,
            currency: loan.currency || 'PKR',
          },
        })
      }
    }

    return NextResponse.json(updatedLoan)
  } catch (error) {
    console.error('Error releasing loan:', error)
    return NextResponse.json({ error: 'Failed to release loan' }, { status: 500 })
  }
}
