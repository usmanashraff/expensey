import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId } from '@/lib/auth'

export async function GET() {
  try {
    const userId = await getUserId()
    
    // Get user settings for initial savings baseline
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId }
    })
    
    // Calculate total savings by summing all monthly savings for this user
    const allSavings = await prisma.savings.findMany({
      where: { userId }
    })
    
    const monthlyTotal = allSavings.reduce((sum, saving) => sum + saving.amount, 0)
    const initialSavings = userSettings?.initialSavings || 0
    const totalSavings = initialSavings + monthlyTotal
    
    return NextResponse.json({ totalSavings, initialSavings, monthlyTotal })
  } catch (error) {
    console.error('Error fetching total savings:', error)
    return NextResponse.json({ error: 'Failed to fetch total savings' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId()
    const body = await request.json()
    const { totalSavings } = body

    if (totalSavings === undefined || totalSavings === null || isNaN(Number(totalSavings))) {
      return NextResponse.json({ error: 'Valid totalSavings is required' }, { status: 400 })
    }

    const newTotalSavings = parseFloat(totalSavings)
    
    // Calculate sum of all monthly savings records
    const allSavings = await prisma.savings.findMany({
      where: { userId }
    })
    const monthlyTotal = allSavings.reduce((sum, saving) => sum + saving.amount, 0)

    // Baseline initial savings is the difference between total savings and accumulated monthly savings
    const newInitialSavings = newTotalSavings - monthlyTotal

    await prisma.userSettings.upsert({
      where: { userId },
      update: { initialSavings: newInitialSavings },
      create: { userId, initialSavings: newInitialSavings, defaultCurrency: 'PKR' },
    })

    return NextResponse.json({ 
      totalSavings: newTotalSavings, 
      initialSavings: newInitialSavings, 
      monthlyTotal 
    })
  } catch (error) {
    console.error('Error updating total savings:', error)
    return NextResponse.json({ error: 'Failed to update total savings' }, { status: 500 })
  }
}