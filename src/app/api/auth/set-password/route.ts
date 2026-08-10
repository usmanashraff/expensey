import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and new password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (!user) {
      return NextResponse.json(
        { error: `User with email ${normalizedEmail} not found` },
        { status: 404 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const updatedUser = await prisma.user.update({
      where: { email: normalizedEmail },
      data: {
        password: hashedPassword,
      },
    })

    return NextResponse.json({
      message: `Password updated successfully for ${updatedUser.email}`,
      email: updatedUser.email,
    })
  } catch (error) {
    console.error('Error setting password:', error)
    return NextResponse.json({ error: 'Failed to set password' }, { status: 500 })
  }
}
