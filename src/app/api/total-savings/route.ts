import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId } from '@/lib/auth'

export async function GET() {
  try {
    const userId = await getUserId()
    // Calculate total savings by summing all monthly savings for this user
    const allSavings = await prisma.savings.findMany({
      where: { userId }
    })
    const totalSavings = allSavings.reduce((sum, saving) => sum + saving.amount, 0)
    
    return NextResponse.json({ totalSavings })
  } catch (error) {
    console.error('Error fetching total savings:', error)
    return NextResponse.json({ error: 'Failed to fetch total savings' }, { status: 500 })
  }
}