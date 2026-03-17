import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get all users (demo auth: role determined by email)
    const staff = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ staff })
  } catch (error) {
    console.error('Staff fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch staff members' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, fullName, role, password } = await request.json()

    // Validate required fields
    if (!email || !fullName || !role || !password) {
      return NextResponse.json(
        { error: 'Email, full name, role, and password are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ['staff', 'admin']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be staff or admin' },
        { status: 400 }
      )
    }

    const { supabaseAdmin } = await import('@/lib/supabase-server')

    // 1. Create user in Supabase Auth using Service Role key
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    })

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    const userId = authData.user.id

    // 2. Create shadow user in Prisma and assign role
    const { prisma } = await import('@/lib/prisma')

    await prisma.$transaction([
      prisma.user.create({
        data: {
          id: userId,
          email,
          fullName,
        }
      }),
      prisma.adminUser.create({
        data: {
          userId: userId,
          role: role
        }
      })
    ])

    return NextResponse.json({
      message: 'Staff member created successfully',
      staff: {
        id: userId,
        email,
        fullName,
        role
      }
    })

  } catch (error: any) {
    console.error('Staff creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create staff member' },
      { status: 500 }
    )
  }
}

// Default permissions based on role
function getDefaultPermissions(role: string) {
  switch (role) {
    case 'admin':
      return {
        products: { view: true, create: true, edit: true, delete: true, activate: true },
        categories: { view: true, create: true, edit: true, delete: true, activate: true },
        orders: { view: true, update: true, refund: true, cancel: true },
        staff: { view: true, invite: true, edit: true, remove: true },
        system: { analytics: true, settings: true, backup: true }
      }

    case 'staff':
      return {
        products: { view: true, create: true, edit: true, delete: false, activate: true },
        categories: { view: true, create: true, edit: true, delete: false, activate: true },
        orders: { view: true, update: true, refund: false, cancel: false },
        staff: { view: false, invite: false, edit: false, remove: false },
        system: { analytics: false, settings: false, backup: false }
      }

    default:
      return {
        products: { view: false, create: false, edit: false, delete: false },
        categories: { view: false, create: false, edit: false, delete: false },
        orders: { view: false, update: false, refund: false, cancel: false },
        staff: { view: false, invite: false, edit: false, remove: false },
        system: { analytics: false, settings: false, backup: false }
      }
  }
}