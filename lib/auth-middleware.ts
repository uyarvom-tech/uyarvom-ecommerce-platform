import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function requireAdmin(request: NextRequest) {
  try {
    // Temporarily bypass session check for debugging
    console.log('Auth middleware called for:', request.url)
    
    // Check if there's an admin user in the database
    const adminUser = await prisma.adminUser.findFirst({
      include: {
        user: true
      }
    })

    console.log('Admin user found:', !!adminUser)

    if (!adminUser) {
      console.log('No admin user found in database')
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
    // This is a simplified version for development
    // In production, you would get the current user from session/auth
    const adminUser = await prisma.adminUser.findFirst({
      include: {
        user: true
      }
    })

    return adminUser?.role || null
  } catch (error) {
    console.error('Get user role failed:', error)
    return null
  }
}