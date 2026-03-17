import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { fullName, role, password } = await request.json()

    // Validate required fields
    if (!fullName || !role) {
      return NextResponse.json(
        { error: 'Full name and role are required' },
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

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      )
    }

    const { supabaseAdmin } = await import('@/lib/supabase-server')

    // 1. Update password in Supabase if provided
    if (password && password.trim()) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
        password: password
      })

      if (authError) {
        return NextResponse.json({ error: authError.message }, { status: 400 })
      }
    }

    // 2. Update metadata in Supabase
    await supabaseAdmin.auth.admin.updateUserById(id, {
      user_metadata: { full_name: fullName }
    })

    // 3. Update staff member in Prisma
    await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: { fullName }
      }),
      prisma.adminUser.upsert({
        where: { userId: id },
        update: { role },
        create: { userId: id, role }
      })
    ])

    return NextResponse.json({
      message: 'Staff member updated successfully',
      staff: {
        id,
        email: existingUser.email,
        fullName,
        role
      }
    })

  } catch (error: any) {
    console.error('Staff update error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update staff member' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const { supabaseAdmin } = await import('@/lib/supabase-server')

    // 1. Delete user from Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id)

    if (authError) {
      // If user doesn't exist in Supabase anymore, we still want to clean up Prisma
      console.warn('User not found in Supabase Auth during deletion:', authError.message)
    }

    // 2. Delete user from Prisma (cascades to admin_users and other relations)
    try {
      await prisma.user.delete({
        where: { id }
      })
    } catch (prismaError: any) {
      // If user doesn't exist in Prisma but was in Supabase, that's okay
      console.warn('User not found in Prisma during deletion:', prismaError.message)
    }

    return NextResponse.json({
      message: 'Staff member deleted successfully'
    })

  } catch (error: any) {
    console.error('Staff deletion error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete staff member' },
      { status: 500 }
    )
  }
}

// Default permissions based on role (same as in route.ts)
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
        products: { view: false, create: false, edit: false, delete: false, activate: false },
        categories: { view: false, create: false, edit: false, delete: false, activate: false },
        orders: { view: false, update: false, refund: false, cancel: false },
        staff: { view: false, invite: false, edit: false, remove: false },
        system: { analytics: false, settings: false, backup: false }
      }
  }
}