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
        const pathname = request.nextUrl.pathname

        // FAST-PATH: Skip auth for public API routes that don't need it
        const publicPaths = ['/api/products', '/api/coupons', '/api/ping', '/api/webhooks']
        if (publicPaths.some(p => pathname.startsWith(p))) {
            return NextResponse.next()
        }

        // FAST-PATH: If we already know Auth or DB is down, skip and save 1.5s per request
        if (isSupabaseAuthDisconnected() || isDatabaseDisconnected()) {
            // Still protect admin routes even when disconnected
            if (pathname.startsWith('/admin')) {
                return NextResponse.redirect(new URL('/auth/admin-login', request.url))
            }
            if (pathname.startsWith('/api/admin')) {
                return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
            }
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
            if (err.name === 'AbortError') {
                console.warn('⚠️ Supabase Auth Timeout (Higher load or slow network)')
            } else if (!isSupabaseAuthDisconnected()) {
                markAuthDisconnected()
            }
            user = null
        }

        // Protect admin PAGES — middleware only verifies the user is logged in.
        // The fine-grained role check is delegated to the admin layout (Prisma-based,
        // more reliable). This avoids a slow/duplicate Supabase query in the proxy
        // that was falsely redirecting authenticated admins to the homepage.
        if (pathname.startsWith('/admin')) {
            if (!user) {
                return NextResponse.redirect(new URL('/auth/admin-login', request.url))
            }
            // Role verification happens in app/admin/layout.tsx
        }

        // Protect API admin routes — only check if user is logged in.
        // The fine-grained role check is done by requireStaffAccess() in each route handler.
        if (pathname.startsWith('/api/admin')) {
            if (!user) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            }
            // Role verification delegated to route-level requireStaffAccess()
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
        // On auth system failure, block admin routes instead of passing through
        const pathname = request.nextUrl.pathname
        if (pathname.startsWith('/admin')) {
            return NextResponse.redirect(new URL('/auth/admin-login', request.url))
        }
        if (pathname.startsWith('/api/admin')) {
            return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
        }
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
