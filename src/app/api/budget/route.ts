import { NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'

const prisma = new PrismaClient()

export async function GET(request: Request) {
  try {
    const { getUser } = getKindeServerSession()
    const user = await getUser()
    
    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = parseInt(searchParams.get('month') || new Date().getMonth() + 1 + '')
    const year = parseInt(searchParams.get('year') || new Date().getFullYear() + '')

    const budget = await prisma.budget.findUnique({
      where: {
        month_year_userId: {
          month,
          year,
          userId: user.id
        }
      }
    })

    return NextResponse.json(budget)
  } catch (error) {
    console.error('Failed to fetch budget:', error)
    return NextResponse.json({ error: 'Failed to fetch budget' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { getUser } = getKindeServerSession()
    const user = await getUser()
    
    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { month, year, needBudget, wantBudget, selfDevelopmentBudget, savingsBudget, currency } = body

    const budget = await prisma.budget.upsert({
      where: {
        month_year_userId: {
          month: parseInt(month),
          year: parseInt(year),
          userId: user.id
        }
      },
      update: {
        needBudget: parseFloat(needBudget) || 0,
        wantBudget: parseFloat(wantBudget) || 0,
        selfDevelopmentBudget: parseFloat(selfDevelopmentBudget) || 0,
        savingsBudget: parseFloat(savingsBudget) || 0,
        currency: currency || 'PKR'
      },
      create: {
        month: parseInt(month),
        year: parseInt(year),
        needBudget: parseFloat(needBudget) || 0,
        wantBudget: parseFloat(wantBudget) || 0,
        selfDevelopmentBudget: parseFloat(selfDevelopmentBudget) || 0,
        savingsBudget: parseFloat(savingsBudget) || 0,
        userId: user.id,
        currency: currency || 'PKR'
      }
    })

    return NextResponse.json(budget)
  } catch (error) {
    console.error('Failed to save budget:', error)
    return NextResponse.json({ error: 'Failed to save budget' }, { status: 500 })
  }
}