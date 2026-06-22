import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'
import { isValidReturnTransition, calculateRefund, type ReturnStatus, type ReturnReason, type RefundMethod } from '@/lib/returns'

/**
 * GET /api/admin/returns/[id] — Return request detail
 * PUT /api/admin/returns/[id] — Update return status (approve/reject/refund)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params

  try {
    const returnReq = await prisma.returnRequest.findUnique({
      where: { id },
      include: { items: true },
    })

    if (!returnReq) {
      return NextResponse.json({ error: 'Return request not found' }, { status: 404 })
    }

    return NextResponse.json(returnReq)
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch return' }, { status: 500 })
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
    const { status, rejectedReason, inspectionResult, inspectionNotes, refundMethod } = body

    const returnReq = await prisma.returnRequest.findUnique({ where: { id } })
    if (!returnReq) {
      return NextResponse.json({ error: 'Return request not found' }, { status: 404 })
    }

    if (status && !isValidReturnTransition(returnReq.status as ReturnStatus, status as ReturnStatus)) {
      return NextResponse.json(
        { error: `Cannot transition from "${returnReq.status}" to "${status}"` },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (status) updateData.status = status
    if (status === 'approved') { updateData.approvedBy = (authResult as any).userId; updateData.approvedAt = new Date() }
    if (status === 'rejected') updateData.rejectedReason = rejectedReason || 'Not eligible'
    if (status === 'received') updateData.receivedAt = new Date()
    if (inspectionResult) { updateData.inspectionResult = inspectionResult; updateData.inspectionNotes = inspectionNotes || null }

    // Process refund
    if (status === 'refunded') {
      const method = (refundMethod || 'original_payment') as RefundMethod
      const refund = calculateRefund(
        returnReq.itemTotal,
        0, 0, returnReq.itemTotal, // Simplified — shipping/tax from order
        returnReq.reason as ReturnReason,
        method,
      )
      updateData.refundAmount = refund.netRefund
      updateData.refundMethod = method
      updateData.refundedAt = new Date()

      // Restore stock for returned items
      const items = await prisma.returnRequestItem.findMany({ where: { returnRequestId: id } })
      for (const item of items) {
        await prisma.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        })
      }

      // Update order returnStatus
      await prisma.order.update({
        where: { id: returnReq.orderId },
        data: { returnStatus: 'refunded' },
      })
    }

    const updated = await prisma.returnRequest.update({ where: { id }, data: updateData })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Return update error:', error)
    return NextResponse.json({ error: error.message || 'Failed to update return' }, { status: 500 })
  }
}
