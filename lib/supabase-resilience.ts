import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Resilient Database Wrapper
 * Wraps Supabase calls with a timeout to prevent app-wide hangs on unstable networks.
 * Especially useful for users on ISP-restricted networks (like Jio DNS).
 */
export async function resilientFetch<T>(
    queryPromise: Promise<{ data: T | null; error: any }>,
    defaultValue: T | null = null,
    timeoutMs: number = 2500
): Promise<{ data: T | null; error: any }> {
    try {
        return await Promise.race([
            queryPromise,
            new Promise<{ data: T | null; error: string }>((_, reject) =>
                setTimeout(() => reject(new Error('Database Timeout')), timeoutMs)
            )
        ])
    } catch (error: any) {
        console.warn('⚠️ Supabase Database Timeout/Failure:', error.message)
        // Return the default value (empty list/null) instead of crashing the page
        return { data: defaultValue, error: error.message }
    }
}
