import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

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

    // Prepare update data
    const updateData: any = { fullName }
    
    // Hash new password if provided
    if (password && password.trim()) {
      updateData.password = await bcrypt.hash(password, 12)
    }

    // Update user (demo auth: role is determined by email, not stored in DB)
    const user = await prisma.user.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      message: 'Staff member updated successfully',
      staff: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.email === 'admin@uyarvom.com' ? 'super_admin' : 'customer'
      }
    })

  } catch (error) {
    console.error('Staff update error:', error)
    return NextResponse.json(
      { error: 'Failed to update staff member' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Check if user exists and is a staff member
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      )
    }

    // Delete user (this will cascade delete the admin user due to the relation)
    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Staff member deleted successfully'
    })

  } catch (error) {
    console.error('Staff deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete staff member' },
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