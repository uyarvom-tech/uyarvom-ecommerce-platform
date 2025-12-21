import { createBrowserClient } from "@supabase/ssr"
import { demoAuth } from "../demo-auth"
import { authenticateUser } from "../demo-users"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  // Check if we're in development mode with placeholder credentials
  const isPlaceholder = supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')
  
  if (isPlaceholder) {
    // Return a mock client for development
    return createMockSupabaseClient()
  }
  
  return createBrowserClient(supabaseUrl, supabaseKey)
}

// Mock Supabase client for development
function createMockSupabaseClient() {
  const mockQuery = {
    select: () => mockQuery,
    from: () => mockQuery,
    eq: () => mockQuery,
    gte: () => mockQuery,
    lte: () => mockQuery,
    ilike: () => mockQuery,
    is: () => mockQuery,
    order: () => mockQuery,
    limit: () => mockQuery,
    insert: () => mockQuery,
    update: () => mockQuery,
    delete: () => mockQuery,
    upsert: () => mockQuery,
    single: () => Promise.resolve({ data: null, error: null }),
    then: (resolve: any) => resolve({ data: [], error: null, count: 0 })
  }

  const mockChannel = {
    on: () => mockChannel,
    subscribe: () => mockChannel,
    unsubscribe: () => Promise.resolve({ error: null })
  }

  const mockSubscription = {
    unsubscribe: () => {}
  }
  
  return {
    from: () => mockQuery,
    rpc: () => Promise.resolve({ data: null, error: null }),
    channel: () => mockChannel,
    removeChannel: () => {},
    auth: {
      getUser: () => {
        const user = demoAuth.getCurrentUser()
        return Promise.resolve({ 
          data: { user: user ? { id: user.id, email: user.email, user_metadata: { full_name: user.full_name, role: user.role } } : null }, 
          error: null 
        })
      },
      signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
        const result = await demoAuth.signIn(email, password)
        if (result.user) {
          return Promise.resolve({ 
            data: { 
              user: { 
                id: result.user.id, 
                email: result.user.email, 
                user_metadata: { 
                  full_name: result.user.full_name, 
                  role: result.user.role 
                } 
              } 
            }, 
            error: null 
          })
        }
        return Promise.resolve({ data: { user: null }, error: { message: result.error } })
      },
      signUp: ({ email, password }: { email: string; password: string }) => {
        // For demo, we don't allow new signups, just return error
        return Promise.resolve({ 
          data: { user: null }, 
          error: { message: 'Signup not available in demo mode. Use existing demo accounts.' } 
        })
      },
      signOut: async () => {
        await demoAuth.signOut()
        return Promise.resolve({ error: null })
      },
      onAuthStateChange: (callback: (event: string, session: any) => void) => {
        const unsubscribe = demoAuth.onAuthStateChange((user) => {
          const session = user ? {
            user: {
              id: user.id,
              email: user.email,
              user_metadata: {
                full_name: user.full_name,
                role: user.role
              }
            }
          } : null
          callback('SIGNED_IN', session)
        })
        
        return { data: { subscription: { unsubscribe } } }
      }
    }
  }
}
