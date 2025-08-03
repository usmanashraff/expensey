import { getUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DashboardClient } from './dashboard-client'

export default async function Dashboard() {
  const user = await getUser()
  
  if (!user || !user.dbUser) {
    redirect('/login')
  }

  // Pass database user data instead of Kinde data
  const userData = {
    id: user.dbUser.kindeId,
    email: user.dbUser.email,
    given_name: user.dbUser.firstName,
    family_name: user.dbUser.lastName,
    picture: user.dbUser.profilePicture
  }

  return <DashboardClient user={userData} />
}