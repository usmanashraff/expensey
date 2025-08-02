import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId()
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    if (!month || !year) {
      return NextResponse.json({ error: 'Month and year are required' }, { status: 400 })
    }

    const savings = await prisma.savings.findUnique({
      where: {
        month_year_userId: {
          month: parseInt(month),
          year: parseInt(year),
          userId,
        },
      },
    })

    return NextResponse.json({ savings: savings?.amount || 0 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch savings' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId()
    const body = await request.json()
    const { amount, month, year } = body

    if (amount === undefined || !month || !year) {
      return NextResponse.json(
        { error: 'Amount, month, and year are required' },
        { status: 400 }
      )
    }

    const savings = await prisma.savings.upsert({
      where: {
        month_year_userId: {
          month: parseInt(month),
          year: parseInt(year),
          userId,
        },
      },
      update: {
        amount: parseFloat(amount),
      },
      create: {
        amount: parseFloat(amount),
        month: parseInt(month),
        year: parseInt(year),
        userId,
      },
    })

    return NextResponse.json(savings)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update savings' }, { status: 500 })
  }
}