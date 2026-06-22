import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const body = await request.json().catch(() => ({}))
    const orderedIds = Array.isArray(body.orderedIds) ? body.orderedIds.filter(Boolean) : []

    if (orderedIds.length === 0) {
      return NextResponse.json({ error: 'orderedIds is required' }, { status: 400 })
    }

    const categories = await prisma.category.findMany({
      where: { id: { in: orderedIds } },
      select: { id: true },
    })

    if (categories.length !== orderedIds.length) {
      return NextResponse.json({ error: 'One or more categories were not found' }, { status: 404 })
    }

    await prisma.$transaction(
      orderedIds.map((id: string, index: number) =>
        prisma.category.update({
          where: { id },
          data: { displayOrder: index },
        }),
      ),
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering categories:', error)
    return NextResponse.json({ error: 'Failed to reorder categories' }, { status: 500 })
  }
}
