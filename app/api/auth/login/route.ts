import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { demoUsers } from '@/lib/demo-users'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check if we're in demo mode
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const isDemo = supabaseUrl.includes('placeholder') || !supabaseUrl || supabaseUrl === 'https://placeholder-supabase-url.supabase.co'
    
    if (isDemo) {
      // Demo mode - use demo users
      const user = demoUsers.find(u => u.email === email && u.password === password)
      
      if (!user) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 400 }
        )
      }

      // Return success response with user data (excluding password)
      const { password: _, ...userWithoutPassword } = user
      return NextResponse.json({
        success: true,
        user: userWithoutPassword,
      })
    } else {
      // Production mode - use Supabase
      const supabase = await createSupabaseServerClient()

      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }

      if (!data.user) {
        return NextResponse.json(
          { error: 'Authentication failed' },
          { status: 400 }
        )
      }

      // Return success response
      return NextResponse.json({
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          fullName: data.user.user_metadata?.full_name || data.user.email,
        },
      })
    }
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}