import { NextResponse, type NextRequest } from 'next/server'
import { getUserById } from '@/lib/demo-users'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request,
  })

  // Get demo user from cookie
  const userCookie = request.cookies.get('demo-user')
  let user = null
  
  if (userCookie?.value) {
    try {
      user = JSON.parse(userCookie.value)
    } catch (e) {
      // Invalid cookie, ignore
    }
  }

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/auth/admin-login', request.url))
    }

    // Check if user has admin or staff role
    if (!['admin', 'staff'].includes(user.role)) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Protect API admin routes
  if (request.nextUrl.pathname.startsWith('/api/admin')) {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin or staff role
    if (!['admin', 'staff'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  // Protect user-specific routes
  if (request.nextUrl.pathname.startsWith('/account') || 
      request.nextUrl.pathname.startsWith('/checkout') ||
      request.nextUrl.pathname.startsWith('/orders')) {
    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}