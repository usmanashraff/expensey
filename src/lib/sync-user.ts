import { PrismaClient } from '@/generated/prisma'

// Create a local instance to avoid initialization issues
const prismaClient = new PrismaClient()

export async function syncUserWithDatabase(kindeUser: {
  id: string
  email?: string | null
  given_name?: string | null
  family_name?: string | null
  picture?: string | null
}) {
  try {
    // Use upsert to avoid race conditions and duplicate key errors
    const user = await prismaClient.user.upsert({
      where: { kindeId: kindeUser.id },
      create: {
        kindeId: kindeUser.id,
        email: kindeUser.email || '',
        firstName: kindeUser.given_name || null,
        lastName: kindeUser.family_name || null,
        profilePicture: kindeUser.picture || null
      },
      update: {
        // Only update email if it changed
        // This preserves user's custom firstName, lastName, and profilePicture
        email: kindeUser.email || undefined
      }
    })

    // Check if user settings exist, create if not
    try {
      await prismaClient.userSettings.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          defaultCurrency: 'PKR'
        },
        update: {} // Don't update anything if it already exists
      })
    } catch (settingsError) {
      // If upsert fails, it might be due to a race condition
      // Just log it and continue, settings likely already exist
      console.log('UserSettings might already exist:', settingsError)
    }

    return user
  } catch (error) {
    console.error('Error syncing user with database:', error)
    throw error
  }
}

export async function getUserFromDatabase(kindeId: string) {
  try {
    const user = await prismaClient.user.findUnique({
      where: { kindeId }
    })
    return user
  } catch (error) {
    console.error('Error fetching user from database:', error)
    return null
  }
}