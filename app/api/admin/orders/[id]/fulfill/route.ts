import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'
import { isValidTransition, type OrderStatus } from '@/lib/orders'

/**
 * POST /api/admin/orders/[id]/fulfill
 * Update order status with validation, tracking, and event logging.
 * Supports split shipments via partial fulfillment.
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
    const { status, trackingNumber, courierName, paymentStatus, notes } = body

    if (!status) {
      return NextResponse.json({ error: 'status is required' }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, orderNumber: true, status: true, paymentStatus: true },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Validate transition
    if (!isValidTransition(order.status as OrderStatus, status as OrderStatus)) {
      return NextResponse.json(
        { error: `Cannot transition from "${order.status}" to "${status}"` },
        { status: 400 }
      )
    }

    const updateData: any = { status }
    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber
    if (courierName !== undefined) updateData.courierName = courierName
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus
    if (status === 'shipped') updateData.shippedAt = new Date()
    if (status === 'delivered') updateData.deliveredAt = new Date()
    if (status === 'cancelled') updateData.cancelledAt = new Date()

    const updated = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({ where: { id }, data: updateData })

      await tx.orderEvent.create({
        data: {
          orderId: id,
          type: status,
          title: `Order ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          description: notes || (trackingNumber ? `Tracking: ${trackingNumber} via ${courierName}` : `Status updated to ${status}`),
          actorId: (authResult as any).userId,
        },
      })

      // If cancelled, restore stock
      if (status === 'cancelled') {
        const items = await tx.orderItem.findMany({ where: { orderId: id } })
        for (const item of items) {
          if (item.productVariantId) {
            await tx.productVariant.update({
              where: { id: item.productVariantId },
              data: { stock: { increment: item.quantity } },
            })
          }
        }
      }

      return updatedOrder
    })

    return NextResponse.json({
      success: true,
      orderId: id,
      previousStatus: order.status,
      newStatus: updated.status,
    })
  } catch (error: any) {
    console.error('Fulfillment error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fulfill order' }, { status: 500 })
  }
}
