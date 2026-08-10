import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId } from '@/lib/auth'

export async function GET() {
  try {
    const userId = await getUserId()
    const loans = await prisma.loan.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(loans)
  } catch (error) {
    console.error('Error fetching loans:', error)
    return NextResponse.json({ error: 'Failed to fetch loans' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId()
    const body = await request.json()
    const { personName, amount, type, description, date, currency } = body

    if (!personName || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json(
        { error: 'Valid person name and positive amount are required' },
        { status: 400 }
      )
    }

    if (!type || (type !== 'GIVEN' && type !== 'TAKEN')) {
      return NextResponse.json(
        { error: 'Type must be GIVEN or TAKEN' },
        { status: 400 }
      )
    }

    const loanDate = date ? new Date(date) : new Date()

    const loan = await prisma.loan.create({
      data: {
        personName,
        amount: parseFloat(amount),
        type,
        status: 'PENDING',
        description: description || null,
        date: loanDate,
        currency: currency || 'PKR',
        userId,
      },
    })

    return NextResponse.json(loan, { status: 201 })
  } catch (error) {
    console.error('Error creating loan:', error)
    return NextResponse.json({ error: 'Failed to create loan' }, { status: 500 })
  }
}
