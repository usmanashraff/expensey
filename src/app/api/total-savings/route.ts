import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Calculate total savings by summing all monthly savings
    const allSavings = await prisma.savings.findMany()
    const totalSavings = allSavings.reduce((sum, saving) => sum + saving.amount, 0)
    
    return NextResponse.json({ totalSavings })
  } catch (error) {
    console.error('Error fetching total savings:', error)
    return NextResponse.json({ error: 'Failed to fetch total savings' }, { status: 500 })
  }
}