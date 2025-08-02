import { getUser } from '@/lib/auth'
import { seedUserUtilityTypes } from '@/lib/seed-user-data'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Seed default utility types for new users
  await seedUserUtilityTypes(user.id)

  return <>{children}</>
}