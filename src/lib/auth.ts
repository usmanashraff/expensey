import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

export async function getUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return null
    }

    const payload = verifyToken(token)
    if (!payload || !payload.userId) {
      return null
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: payload.userId },
    })

    if (!dbUser) {
      return null
    }

    return {
      id: dbUser.id,
      email: dbUser.email,
      given_name: dbUser.firstName,
      family_name: dbUser.lastName,
      picture: dbUser.profilePicture,
      dbId: dbUser.id,
      dbUser: dbUser,
    }
  } catch (error) {
    console.error('Error getting user from session:', error)
    return null
  }
}

export async function getUserId() {
  const user = await getUser()

  if (!user || !user.dbUser || !user.dbId) {
    redirect('/login')
  }

  return user.dbId
}