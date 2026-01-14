import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's admin role - using demo auth
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get deletion tickets (demo auth: admin sees all, others see their own)
    const isAdmin = user.email === 'admin@uyarvom.com'
    
    const tickets = await prisma.deletionTicket.findMany({
      where: isAdmin ? {} : { requestedBy: dbUser.id },
      include: {
        requester: {
          select: { id: true, fullName: true, email: true }
        },
        reviewer: {
          select: { id: true, fullName: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ tickets })
  } catch (error) {
    console.error('Deletion tickets fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deletion tickets' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get current user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's admin role - using demo auth
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { type, itemId, itemName, reason } = await request.json()

    // Validate required fields
    if (!type || !itemId || !itemName || !reason) {
      return NextResponse.json(
        { error: 'Type, item ID, item name, and reason are required' },
        { status: 400 }
      )
    }

    // Validate type
    if (!['product', 'category'].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be either "product" or "category"' },
        { status: 400 }
      )
    }

    // Create deletion ticket
    const ticket = await prisma.deletionTicket.create({
      data: {
        type,
        itemId,
        itemName,
        reason,
        requestedBy: dbUser.id
      },
      include: {
        requester: {
          select: { id: true, fullName: true, email: true }
        }
      }
    })

    return NextResponse.json({
      message: 'Deletion request submitted successfully',
      ticket
    })

  } catch (error) {
    console.error('Deletion ticket creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create deletion ticket' },
      { status: 500 }
    )
  }
}