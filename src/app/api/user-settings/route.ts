import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getUser()
    if (!user || !user.dbUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const settings = await prisma.userSettings.findUnique({
      where: { userId: user.dbUser.id }
    })
    
    return NextResponse.json(settings || { defaultCurrency: 'PKR' })
  } catch (error) {
    console.error('Error fetching user settings:', error)
    return NextResponse.json({ error: 'Failed to fetch user settings' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUser()
    if (!user || !user.dbUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { defaultCurrency } = body

    if (!defaultCurrency) {
      return NextResponse.json(
        { error: 'Default currency is required' },
        { status: 400 }
      )
    }

    const settings = await prisma.userSettings.upsert({
      where: { userId: user.dbUser.id },
      update: { defaultCurrency },
      create: { userId: user.dbUser.id, defaultCurrency }
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error saving user settings:', error)
    return NextResponse.json({ error: 'Failed to save user settings' }, { status: 500 })
  }
}