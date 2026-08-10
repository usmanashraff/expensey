import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await getUser()
    
    if (!user || !user.dbUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch fresh data from database instead of using cached dbUser
    const freshUser = await prisma.user.findUnique({
      where: { id: user.dbUser.id }
    })

    if (!freshUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: freshUser.id,
      email: freshUser.email,
      given_name: freshUser.firstName,
      family_name: freshUser.lastName,
      picture: freshUser.profilePicture
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getUser()
    
    if (!user || !user.dbUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { given_name, family_name, picture } = body

    console.log('Updating user:', {
      userId: user.dbUser.id,
      firstName: given_name,
      lastName: family_name,
      hasProfilePicture: !!picture
    })

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: user.dbUser.id },
      data: {
        firstName: given_name,
        lastName: family_name,
        profilePicture: picture
      }
    })
    
    console.log('User updated:', {
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName
    })
    
    return NextResponse.json({
      id: updatedUser.id,
      email: updatedUser.email,
      given_name: updatedUser.firstName,
      family_name: updatedUser.lastName,
      picture: updatedUser.profilePicture
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}