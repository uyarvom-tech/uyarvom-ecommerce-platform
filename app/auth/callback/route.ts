import { createSupabaseServerClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { syncAuthUserToPrisma } from '@/lib/user-sync'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in search params, use it as the redirection URL after successful sign in
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const supabase = await createSupabaseServerClient()
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error && data.user) {
            await syncAuthUserToPrisma(data.user)

            // Determine the redirect base URL
            // In development, we use NEXT_PUBLIC_APP_URL (http://localhost:3001)
            // In production, we can use the origin or forwarded host
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || origin
            const forwardedHost = request.headers.get('x-forwarded-host')

            if (forwardedHost && process.env.NODE_ENV === 'production') {
                return NextResponse.redirect(`https://${forwardedHost}${next}`)
            }

            return NextResponse.redirect(`${baseUrl}${next}`)
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
