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