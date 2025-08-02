import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId } from '@/lib/auth'

export async function GET() {
  try {
    const userId = await getUserId()
    const utilityTypes = await prisma.utilityType.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(utilityTypes)
  } catch (error) {
    console.error('Error fetching utility types:', error)
    return NextResponse.json({ error: 'Failed to fetch utility types' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId()
    const body = await request.json()
    console.log('Creating utility type with data:', body)
    const { name } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      console.log('Invalid name provided:', name)
      return NextResponse.json(
        { error: 'Utility type name is required' },
        { status: 400 }
      )
    }

    const trimmedName = name.trim()

    // Check if utility type already exists for this user
    const existing = await prisma.utilityType.findUnique({
      where: { 
        name_userId: {
          name: trimmedName,
          userId
        }
      },
    })

    if (existing) {
      console.log('Utility type already exists:', trimmedName)
      return NextResponse.json(
        { error: 'Utility type already exists' },
        { status: 400 }
      )
    }

    console.log('Creating new utility type:', trimmedName)
    const utilityType = await prisma.utilityType.create({
      data: { 
        name: trimmedName,
        userId 
      },
    })

    console.log('Successfully created utility type:', utilityType)
    return NextResponse.json(utilityType, { status: 201 })
  } catch (error) {
    console.error('Error creating utility type:', error)
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error')
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
    
    return NextResponse.json({ 
      error: 'Failed to create utility type',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Utility type ID is required' },
        { status: 400 }
      )
    }

    // Check if utility type is being used by any expenses for this user
    const expensesUsingType = await prisma.expense.findFirst({
      where: { 
        subcategory: id,
        userId 
      },
    })

    if (expensesUsingType) {
      // Get the utility type name for better error message
      const utilityType = await prisma.utilityType.findUnique({
        where: { 
          id,
          userId 
        },
      })
      
      if (utilityType) {
        // Update expenses to use the utility type name instead of ID
        await prisma.expense.updateMany({
          where: { 
            subcategory: id,
            userId 
          },
          data: { subcategory: utilityType.name },
        })
      }
    }

    await prisma.utilityType.delete({
      where: { 
        id,
        userId 
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting utility type:', error)
    return NextResponse.json({ error: 'Failed to delete utility type' }, { status: 500 })
  }
}