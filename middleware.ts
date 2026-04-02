import {
  createSupabaseProxyClient,
  isDatabaseDisconnected,
  isSupabaseAuthDisconnected,
  markAuthDisconnected,
  markDatabaseDisconnected,
  resetSupabaseConnection,
} from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Next.js 16 Proxy layer (formerly middleware)
 * Handles routing, security boundaries, and session persistence.
 */
export async function middleware(request: NextRequest) {
    try {
        // FAST-PATH: If we already know Auth or DB is down, skip and save 1.5s per request
        if (isSupabaseAuthDisconnected() || isDatabaseDisconnected()) {
            return NextResponse.next()
        }

        const controller = new AbortController()
        // Increased timeout to 15s to be more resilient on slower connections/cold starts
        const timeoutId = setTimeout(() => controller.abort(), 15000)

        const { supabase, response } = createSupabaseProxyClient(request, controller.signal)

        let user = null
        try {
          const { data } = await supabase.auth.getUser()
          user = data?.user || null
          if (user) {
            resetSupabaseConnection()
          }
          clearTimeout(timeoutId)
        } catch (err: any) {
            clearTimeout(timeoutId)

            // SILENT RECOVERY: AbortError is handled gracefully
            if (err.name === 'AbortError') {
                console.warn('⚠️ Supabase Auth Timeout (Higher load or slow network)')
            } else if (!isSupabaseAuthDisconnected()) {
                markAuthDisconnected()
            }
            user = null
        }

        const pathname = request.nextUrl.pathname

        // Protect admin routes
        if (pathname.startsWith('/admin')) {
            if (!user) {
                return NextResponse.redirect(new URL('/auth/admin-login', request.url))
            }

            // FAST-PATH: If network is down, we cannot check roles
            if (isDatabaseDisconnected()) {
                return NextResponse.redirect(new URL('/', request.url))
            }

            // Check if user has admin role
            const { data: adminUser, error: adminError } = await supabase
                .from('admin_users')
                .select('role')
                .eq('user_id', user.id)
                .single()

            if (adminError) {
                markDatabaseDisconnected()
                return NextResponse.redirect(new URL('/', request.url))
            }

            if (!adminUser || !['admin', 'staff', 'super_admin'].includes(adminUser.role)) {
                return NextResponse.redirect(new URL('/', request.url))
            }
        }

        // Protect API admin routes
        if (pathname.startsWith('/api/admin')) {
            if (!user) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            }

            // FAST-PATH: If network is down, we cannot check roles
            if (isDatabaseDisconnected()) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
            }

            // Check if user has admin role
            const { data: adminUser, error: adminError } = await supabase
                .from('admin_users')
                .select('role')
                .eq('user_id', user.id)
                .single()

            if (adminError) {
                markDatabaseDisconnected()
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
            }

            if (!adminUser || !['admin', 'staff', 'super_admin'].includes(adminUser.role)) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
            }
        }

        // Protect user-specific routes
        const protectedRoutes = ["/account", "/checkout", "/orders"]
        if (protectedRoutes.some(route => pathname.startsWith(route))) {
            if (!user) {
                return NextResponse.redirect(new URL('/auth/login', request.url))
            }
        }

        return response
    } catch (error) {
        console.error('Proxy internal error:', error)
        return NextResponse.next()
    }
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
