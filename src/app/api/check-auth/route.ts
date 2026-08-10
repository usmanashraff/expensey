import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'

export async function GET() {
  const user = await getUser()
  const authenticated = !!user

  return NextResponse.json({
    authenticated,
    user: user
      ? {
          id: user.id,
          email: user.email,
          given_name: user.given_name,
          family_name: user.family_name,
          picture: user.picture,
        }
      : null,
  })
}