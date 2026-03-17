import { createSupabaseServerClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { syncAuthUserToPrisma } from '@/lib/user-sync'

export async function POST(request: Request) {
  try {
    const { email, password, fullName } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = await createSupabaseServerClient()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || null,
        }
      }
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    if (data.user) {
      await syncAuthUserToPrisma(data.user)
    }

    return NextResponse.json({
      success: true,
      user: data.user ? {
        id: data.user.id,
        email: data.user.email,
        fullName: fullName || null,
      } : null,
      message: 'Registration successful. Please check your email to verify your account.',
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
