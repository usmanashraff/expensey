import { NextResponse } from 'next/server'
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"

export async function GET() {
  const { isAuthenticated } = getKindeServerSession()
  const authenticated = await isAuthenticated()
  
  return NextResponse.json({ authenticated })
}