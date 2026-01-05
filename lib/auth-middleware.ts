import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function requireAdmin(request: NextRequest) {
  try {
    // Get current user from Supabase (which uses demo auth in development)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    console.log('Auth middleware - current user:', user?.email)
    
    if (!user) {
      console.log('No user found')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Find the admin user record for this user
    const adminUser = await prisma.adminUser.findFirst({
      where: {
        user: {
          email: user.email
        }
      },
      include: {
        user: true
      }
    })

    console.log('Admin user found:', !!adminUser, 'role:', adminUser?.role)

    if (!adminUser) {
      console.log('User is not an admin')
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Return the admin user for use in the route
    return { user: adminUser.user, adminUser }
  } catch (error) {
    console.error('Auth middleware error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}

// Check if user has admin role (can delete items)
export async function requireAdminRole(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    
    // If requireAdmin returned an error response, return it
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { adminUser } = authResult
    
    // Only users with 'super_admin' role can perform admin-only actions
    if (adminUser.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Admin role required for this action' },
        { status: 403 }
      )
    }

    return authResult
  } catch (error) {
    console.error('Admin role check error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}

// Check if user has staff or admin access (can edit items)
export async function requireStaffAccess(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    
    // If requireAdmin returned an error response, return it
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { adminUser } = authResult
    
    // Both 'super_admin' and 'moderator' roles can access staff-level features
    if (!['super_admin', 'moderator'].includes(adminUser.role)) {
      return NextResponse.json(
        { error: 'Staff access required' },
        { status: 403 }
      )
    }

    return authResult
  } catch (error) {
    console.error('Staff access check error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}

// Simplified auth check for client-side components
export async function checkAdminAccess() {
  try {
    // Check if there's an admin user in the database
    const adminUser = await prisma.adminUser.findFirst({
      include: {
        user: true
      }
    })

    return !!adminUser
  } catch (error) {
    console.error('Admin access check failed:', error)
    return false
  }
}

// Get current user role for client-side components
export async function getCurrentUserRole() {
  try {
    // Get current user from Supabase (which uses demo auth in development)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    console.log('getCurrentUserRole - current user:', user?.email)
    
    if (!user) {
      console.log('No user found')
      return null
    }

    // Find the admin user record for this user
    const adminUser = await prisma.adminUser.findFirst({
      where: {
        user: {
          email: user.email
        }
      },
      include: {
        user: true
      }
    })

    console.log('getCurrentUserRole - admin user found:', !!adminUser, 'role:', adminUser?.role)

    return adminUser?.role || null
  } catch (error) {
    console.error('Get user role failed:', error)
    return null
  }
}