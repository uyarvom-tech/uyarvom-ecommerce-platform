import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    
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

    // Only admins can approve/reject tickets (check email for demo auth)
    if (!dbUser || user.email !== 'admin@uyarvom.com') {
      return NextResponse.json({ error: 'Only admins can review deletion tickets' }, { status: 403 })
    }

    const { action } = await request.json() // "approve" or "reject"

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be either "approve" or "reject"' },
        { status: 400 }
      )
    }

    // Get the ticket
    const ticket = await prisma.deletionTicket.findUnique({
      where: { id }
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    if (ticket.status !== 'pending') {
      return NextResponse.json({ error: 'Ticket has already been reviewed' }, { status: 400 })
    }

    // Update ticket status
    const updatedTicket = await prisma.deletionTicket.update({
      where: { id },
      data: {
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewedBy: dbUser.id
      },
      include: {
        requester: {
          select: { id: true, fullName: true, email: true }
        },
        reviewer: {
          select: { id: true, fullName: true, email: true }
        }
      }
    })

    // If approved, delete the actual item
    if (action === 'approve') {
      try {
        if (ticket.type === 'product') {
          await prisma.product.delete({
            where: { id: ticket.itemId }
          })
        } else if (ticket.type === 'category') {
          await prisma.category.delete({
            where: { id: ticket.itemId }
          })
        }
      } catch (deleteError) {
        console.error('Failed to delete item:', deleteError)
        // Update ticket to reflect deletion failure
        await prisma.deletionTicket.update({
          where: { id },
          data: { status: 'rejected' }
        })
        return NextResponse.json(
          { error: 'Failed to delete item. It may have dependencies.' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json({
      message: `Deletion request ${action}d successfully`,
      ticket: updatedTicket
    })

  } catch (error) {
    console.error('Deletion ticket review error:', error)
    return NextResponse.json(
      { error: 'Failed to review deletion ticket' },
      { status: 500 }
    )
  }
}