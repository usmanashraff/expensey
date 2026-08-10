import { NextResponse, NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value
  const { pathname } = req.nextUrl

  // Protected paths requiring auth
  const isProtectedPath = pathname.startsWith('/dashboard') || pathname.startsWith('/settings')
  
  if (isProtectedPath && !token) {
    const loginUrl = new URL('/login', req.url)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated user away from login/register to dashboard
  if ((pathname === '/login' || pathname === '/register') && token) {
    const dashboardUrl = new URL('/dashboard', req.url)
    return NextResponse.redirect(dashboardUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/settings/:path*',
    '/login',
    '/register',
  ],
}