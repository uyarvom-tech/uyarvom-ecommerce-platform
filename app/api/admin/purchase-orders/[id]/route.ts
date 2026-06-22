import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'
import { isValidPOTransition, type POStatus } from '@/lib/procurement'

/**
 * GET /api/admin/purchase-orders/[id] — Get PO detail
 * PUT /api/admin/purchase-orders/[id] — Update PO status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params

  try {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        vendor: true,
        lineItems: {
          include: {
            variant: {
              select: { id: true, sku: true, size: true, stock: true, product: { select: { name: true } }, color: { select: { colorName: true } } },
            },
          },
        },
        goodsReceipts: {
          include: { items: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!po) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    return NextResponse.json(po)
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch purchase order' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params

  try {
    const body = await request.json()
    const { status, notes, cancellationReason } = body

    const po = await prisma.purchaseOrder.findUnique({ where: { id }, select: { status: true } })
    if (!po) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    if (status && !isValidPOTransition(po.status as POStatus, status as POStatus)) {
      return NextResponse.json(
        { error: `Cannot transition PO from "${po.status}" to "${status}"` },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (status) updateData.status = status
    if (notes !== undefined) updateData.notes = notes
    if (status === 'approved') { updateData.approvedBy = (authResult as any).userId; updateData.approvedAt = new Date() }
    if (status === 'sent') updateData.sentAt = new Date()
    if (status === 'received') updateData.receivedAt = new Date()
    if (status === 'cancelled') { updateData.cancelledAt = new Date(); updateData.cancellationReason = cancellationReason || null }

    const updated = await prisma.purchaseOrder.update({ where: { id }, data: updateData })

    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update purchase order' }, { status: 500 })
  }
}
