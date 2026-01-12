import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, supabaseAdmin } from '@/lib/supabase-server'

// Get current user from Supabase session
export async function getCurrentUser() {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }

    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

// Get current user role from database
export async function getCurrentUserRole() {
  try {
    const user = await getCurrentUser()
    if (!user) return null

    // Check if user has admin role in the database
    const { data: adminUser } = await supabaseAdmin
      .from('admin_users')
      .select('role')
      .eq('user_id', user.id)
      .single()

    return adminUser?.role || 'customer'
  } catch (error) {
    console.error('Error getting user role:', error)
    return 'customer'
  }
}

// Check if user has staff access (admin or staff role)
export async function requireStaffAccess(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const role = await getCurrentUserRole()
    if (!['admin', 'staff', 'super_admin'].includes(role || '')) {
      return NextResponse.json({ error: 'Staff access required' }, { status: 403 })
    }

    return { user, role }
  } catch (error) {
    console.error('Error checking staff access:', error)
    return NextResponse.json({ error: 'Authentication error' }, { status: 500 })
  }
}

// Check if user has admin access
export async function requireAdminAccess(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const role = await getCurrentUserRole()
    if (!['admin', 'super_admin'].includes(role || '')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    return { user, role }
  } catch (error) {
    console.error('Error checking admin access:', error)
    return NextResponse.json({ error: 'Authentication error' }, { status: 500 })
  }
}

// Legacy function names for backward compatibility
export const requireAdmin = requireStaffAccess
export const requireAdminRole = requireAdminAccess

// Simplified auth check for client-side components
export async function checkAdminAccess() {
  try {
    const role = await getCurrentUserRole()
    return ['admin', 'super_admin'].includes(role || '')
  } catch (error) {
    console.error('Admin access check failed:', error)
    return false
  }
}