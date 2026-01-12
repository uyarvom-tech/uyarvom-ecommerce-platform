import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST() {
  try {
    // Check if we're in demo mode
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const isDemo = supabaseUrl.includes('placeholder') || !supabaseUrl || supabaseUrl === 'https://placeholder-supabase-url.supabase.co'
    
    if (isDemo) {
      // Demo mode - just return success
      return NextResponse.json({
        success: true,
        message: 'Logged out successfully',
      })
    } else {
      // Production mode - use Supabase
      const supabase = await createSupabaseServerClient()

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('Logout error:', error)
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Logged out successfully',
      })
    }
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}