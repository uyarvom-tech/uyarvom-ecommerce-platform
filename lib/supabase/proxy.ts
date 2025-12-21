import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  // Check if we're in development mode with placeholder credentials
  const isPlaceholder = supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')
  
  if (isPlaceholder) {
    // In demo mode, handle authentication via cookies
    return handleDemoAuth(request)
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes that require authentication
  const protectedRoutes = ["/account", "/checkout", "/orders", "/cart", "/wishlist"]
  const adminRoutes = ["/admin"]

  const pathname = request.nextUrl.pathname

  // Redirect to login if accessing protected routes without authentication
  if (!user && protectedRoutes.some((route) => pathname.startsWith(route))) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    url.searchParams.set("redirect", pathname)
    return NextResponse.redirect(url)
  }

  // Check admin access
  if (user && adminRoutes.some((route) => pathname.startsWith(route))) {
    const { data: adminUser } = await supabase.from("admin_users").select("*").eq("id", user.id).single()

    if (!adminUser) {
      const url = request.nextUrl.clone()
      url.pathname = "/"
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
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
