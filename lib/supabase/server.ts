import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Always create a new client within each function when using it.
 * Do not store in a global variable.
 */
export async function createClient() {
  const cookieStore = await cookies()
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  // Check if we're in development mode with placeholder credentials
  const isPlaceholder = supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')
  
  if (isPlaceholder) {
    // Return a mock client for development
    return createMockSupabaseClient(cookieStore)
  }

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The "setAll" method was called from a Server Component.
          // This can be ignored if you have proxy refreshing user sessions.
        }
      },
    },
  })
}

// Mock Supabase client for development
function createMockSupabaseClient(cookieStore: any) {
  // Create a chainable query builder that returns promises at the end
  const createQueryBuilder = (): any => ({
    select: (columns?: string, options?: any) => createQueryBuilder(),
    insert: (data: any) => createQueryBuilder(),
    update: (data: any) => createQueryBuilder(),
    delete: () => createQueryBuilder(),
    upsert: (data: any) => createQueryBuilder(),
    eq: (column: string, value: any) => createQueryBuilder(),
    gte: (column: string, value: any) => createQueryBuilder(),
    lte: (column: string, value: any) => createQueryBuilder(),
    ilike: (column: string, value: any) => createQueryBuilder(),
    is: (column: string, value: any) => createQueryBuilder(),
    or: (query: string) => createQueryBuilder(),
    in: (column: string, values: any[]) => createQueryBuilder(),
    order: (column: string, options?: any) => createQueryBuilder(),
    limit: (count: number) => createQueryBuilder(),
    single: () => Promise.resolve({ data: null, error: null }),
    // Make it awaitable by implementing then
    then: (resolve: any) => resolve({ data: [], error: null, count: 0 })
  })

  const mockChannel = {
    on: () => mockChannel,
    subscribe: () => mockChannel,
    unsubscribe: () => Promise.resolve({ error: null })
  }

  const mockSubscription = {
    unsubscribe: () => {}
  }

  // Get user from cookie for server-side
  function getCurrentUserFromCookie() {
    try {
      const userCookie = cookieStore.get('demo-user')
      if (userCookie?.value) {
        return JSON.parse(userCookie.value)
      }
    } catch (e) {
      // Invalid cookie data
    }
    return null
  }
  
  return {
    from: (table: string) => createQueryBuilder(),
    rpc: () => Promise.resolve({ data: null, error: null }),
    channel: () => mockChannel,
    removeChannel: () => {},
    auth: {
      getUser: () => {
        const user = getCurrentUserFromCookie()
        return Promise.resolve({ 
          data: { user: user ? { id: user.id, email: user.email, user_metadata: { full_name: user.full_name, role: user.role } } : null }, 
          error: null 
        })
      },
      onAuthStateChange: () => ({ data: { subscription: mockSubscription } })
    }
  }
}
