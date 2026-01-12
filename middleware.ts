import { createSupabaseMiddlewareClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    // Check if we're in demo mode (placeholder Supabase URLs)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const isDemo = supabaseUrl.includes('placeholder') || !supabaseUrl || supabaseUrl === 'https://placeholder-supabase-url.supabase.co'
    
    if (isDemo) {
      // In demo mode, handle authentication via cookies
      return handleDemoAuth(request)
    }

    const { supabase, response } = createSupabaseMiddlewareClient(request)

    // Refresh session if expired - required for Server Components
    const { data: { user } } = await supabase.auth.getUser()

    // Protect admin routes
    if (request.nextUrl.pathname.startsWith('/admin')) {
      if (!user) {
        return NextResponse.redirect(new URL('/auth/login', request.url))
      }

      // Check if user has admin role
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (!adminUser || !['admin', 'staff', 'super_admin'].includes(adminUser.role)) {
        return NextResponse.redirect(new URL('/', request.url))
      }
    }

    // Protect API admin routes
    if (request.nextUrl.pathname.startsWith('/api/admin')) {
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      // Check if user has admin role
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (!adminUser || !['admin', 'staff', 'super_admin'].includes(adminUser.role)) {
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
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.next()
  }
}

// Handle authentication in demo mode
function handleDemoAuth(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Get user from cookie
  let user = null
  try {
    const userCookie = request.cookies.get('demo-user')
    if (userCookie?.value) {
      user = JSON.parse(userCookie.value)
    }
  } catch (e) {
    // Invalid cookie data
  }

  // Protected routes that require authentication
  const protectedRoutes = ["/account", "/checkout", "/orders", "/cart", "/wishlist"]
  const adminRoutes = ["/admin"]

  // Redirect to login if accessing protected routes without authentication
  if (!user && protectedRoutes.some((route) => pathname.startsWith(route))) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    url.searchParams.set("redirect", pathname)
    return NextResponse.redirect(url)
  }

  // Check admin/staff access
  if (user && adminRoutes.some((route) => pathname.startsWith(route))) {
    if (user.role !== 'admin' && user.role !== 'staff') {
      const url = request.nextUrl.clone()
      url.pathname = "/"
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next({
    request,
  })
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