import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { getUserById } from '@/lib/demo-users'

// Helper function to get current user from demo auth cookie
async function getCurrentDemoUser(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userCookie = cookieStore.get('demo-user')
    
    if (!userCookie?.value) {
      return null
    }

    const user = JSON.parse(userCookie.value)
    return user
  } catch (error) {
    console.error('Error parsing demo user cookie:', error)
    return null
  }
}

export async function requireAdmin(request: NextRequest) {
  try {
    // Get current user from demo auth cookie
    const user = await getCurrentDemoUser(request)
    
    console.log('Auth middleware - current user:', user?.email)
    
    if (!user) {
      console.log('No user found')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user has admin or staff role
    if (!['admin', 'staff'].includes(user.role)) {
      console.log('User is not an admin or staff')
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    console.log('Admin user found:', user.email, 'role:', user.role)

    // Return the user for use in the route
    return { user, adminUser: { role: user.role === 'admin' ? 'super_admin' : 'moderator' } }
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

    const { user } = authResult
    
    // Only users with 'admin' role can perform admin-only actions
    if (user.role !== 'admin') {
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

    const { user } = authResult
    
    // Both 'admin' and 'staff' roles can access staff-level features
    if (!['admin', 'staff'].includes(user.role)) {
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
    // For demo mode, we'll always return true if there are demo users
    return true
  } catch (error) {
    console.error('Admin access check failed:', error)
    return false
  }
}

// Get current user role for client-side components
export async function getCurrentUserRole() {
  try {
    const cookieStore = await cookies()
    const userCookie = cookieStore.get('demo-user')
    
    if (!userCookie?.value) {
      console.log('No user cookie found')
      return null
    }

    const user = JSON.parse(userCookie.value)
    console.log('getCurrentUserRole - current user:', user.email, 'role:', user.role)

    return user.role === 'admin' ? 'super_admin' : user.role === 'staff' ? 'moderator' : null
  } catch (error) {
    console.error('Get user role failed:', error)
    return null
  }
}