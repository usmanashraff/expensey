import { getUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DashboardClient } from './dashboard-client'

export default async function Dashboard() {
  const user = await getUser()
  
  if (!user) {
    redirect('/login')
  }

  return <DashboardClient user={user} />
}