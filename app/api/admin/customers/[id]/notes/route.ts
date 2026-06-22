import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'

/**
 * POST /api/admin/customers/[id]/notes — Add a note to a customer
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params

  try {
    const { type, content, reference } = await request.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Note content is required' }, { status: 400 })
    }

    const note = await prisma.customerNote.create({
      data: {
        userId: id,
        authorId: (authResult as any).userId,
        type: type || 'general',
        content: content.trim(),
        reference: reference || null,
      },
    })

    return NextResponse.json(note, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to add note' }, { status: 500 })
  }
}
