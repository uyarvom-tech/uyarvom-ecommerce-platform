import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'
import { validateGoodsReceipt } from '@/lib/procurement'

/**
 * POST /api/admin/purchase-orders/[id]/receive
 * Record a goods receipt for a PO. Validates quantities and updates stock.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params

  try {
    const body = await request.json()
    const { items, notes } = body

    if (!items?.length) {
      return NextResponse.json({ error: 'items array is required' }, { status: 400 })
    }

    // Get PO with line items
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { lineItems: true, vendor: true },
    })

    if (!po) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    if (!['sent', 'partially_received', 'approved'].includes(po.status)) {
      return NextResponse.json({ error: `PO status "${po.status}" cannot receive goods` }, { status: 400 })
    }

    // Validate receipt items
    const receiptItems = items.map((item: any) => {
      const poLine = po.lineItems.find((li: any) => li.id === item.poLineId || li.variantId === item.variantId)
      return {
        poLineId: item.poLineId || poLine?.id || 'unknown',
        orderedQty: poLine?.quantity || 0,
        receivedQty: item.receivedQty || 0,
        acceptedQty: item.acceptedQty || item.receivedQty || 0,
        rejectedQty: item.rejectedQty || 0,
        rejectionReason: item.rejectionReason,
      }
    })

    const validation = validateGoodsReceipt(receiptItems)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.errors.join('; ') }, { status: 400 })
    }

    // Create goods receipt and update stock
    const receiptNumber = `GR-${Date.now()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`

    const result = await prisma.$transaction(async (tx) => {
      const receipt = await tx.goodsReceipt.create({
        data: {
          receiptNumber,
          purchaseOrderId: id,
          vendorId: po.vendorId,
          status: 'approved',
          receivedBy: (authResult as any).userId,
          notes: notes || null,
          items: {
            create: items.map((item: any) => ({
              variantId: item.variantId,
              orderedQty: item.orderedQty || 0,
              receivedQty: item.receivedQty || 0,
              acceptedQty: item.acceptedQty || item.receivedQty || 0,
              rejectedQty: item.rejectedQty || 0,
              rejectionReason: item.rejectionReason || null,
            })),
          },
        },
      })

      // Update variant stock for accepted quantities
      for (const item of items) {
        const acceptedQty = item.acceptedQty || item.receivedQty || 0
        if (acceptedQty > 0 && item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: acceptedQty } },
          })

          // Log stock adjustment
          await tx.stockAdjustment.create({
            data: {
              variantId: item.variantId,
              type: 'increment',
              quantity: acceptedQty,
              previousQty: 0, // Will be approximate
              newQty: 0, // Will be approximate
              reason: 'received',
              reference: po.poNumber,
              actorId: (authResult as any).userId,
            },
          })
        }
      }

      // Update PO line items receivedQty
      for (const item of items) {
        const poLine = po.lineItems.find((li: any) => li.variantId === item.variantId)
        if (poLine) {
          const newReceivedQty = poLine.receivedQty + (item.receivedQty || 0)
          await tx.purchaseOrderItem.update({
            where: { id: poLine.id },
            data: { receivedQty: newReceivedQty },
          })
        }
      }

      // Update PO status
      const updatedLines = await tx.purchaseOrderItem.findMany({ where: { purchaseOrderId: id } })
      const allReceived = updatedLines.every((line: any) => line.receivedQty >= line.quantity)
      const someReceived = updatedLines.some((line: any) => line.receivedQty > 0)

      const newPOStatus = allReceived ? 'received' : someReceived ? 'partially_received' : po.status
      await tx.purchaseOrder.update({ where: { id }, data: { status: newPOStatus, receivedAt: allReceived ? new Date() : undefined } })

      return receipt
    })

    return NextResponse.json({ success: true, receiptNumber, receiptId: result.id })
  } catch (error: any) {
    console.error('Goods receipt error:', error)
    return NextResponse.json({ error: error.message || 'Failed to process goods receipt' }, { status: 500 })
  }
}
