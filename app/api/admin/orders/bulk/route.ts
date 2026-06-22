import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'
import { isValidTransition, type OrderStatus } from '@/lib/orders'

/**
 * POST /api/admin/orders/bulk
 * Bulk update order statuses. Used for batch processing.
 * Body: { orderIds: string[], status: string, trackingPrefix?: string, courierName?: string }
 */
export async function POST(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const body = await request.json()
    const { orderIds, status, courierName } = body

    if (!orderIds?.length || !status) {
      return NextResponse.json({ error: 'orderIds array and status are required' }, { status: 400 })
    }

    if (orderIds.length > 100) {
      return NextResponse.json({ error: 'Maximum 100 orders per batch' }, { status: 400 })
    }

    // Fetch all orders
    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      select: { id: true, orderNumber: true, status: true },
    })

    const results: Array<{ orderId: string; success: boolean; error?: string }> = []

    for (const order of orders) {
      if (!isValidTransition(order.status as OrderStatus, status as OrderStatus)) {
        results.push({ orderId: order.id, success: false, error: `Cannot transition from "${order.status}" to "${status}"` })
        continue
      }

      try {
        const updateData: any = { status }
        if (status === 'shipped') updateData.shippedAt = new Date()
        if (status === 'delivered') updateData.deliveredAt = new Date()
        if (status === 'cancelled') updateData.cancelledAt = new Date()
        if (courierName) updateData.courierName = courierName

        await prisma.$transaction(async (tx) => {
          await tx.order.update({ where: { id: order.id }, data: updateData })
          await tx.orderEvent.create({
            data: {
              orderId: order.id,
              type: status,
              title: `Bulk: Order ${status.charAt(0).toUpperCase() + status.slice(1)}`,
              description: `Bulk status update to ${status}`,
              actorId: (authResult as any).userId,
            },
          })

          if (status === 'cancelled') {
            const items = await tx.orderItem.findMany({ where: { orderId: order.id } })
            for (const item of items) {
              if (item.productVariantId) {
                await tx.productVariant.update({
                  where: { id: item.productVariantId },
                  data: { stock: { increment: item.quantity } },
                })
              }
            }
          }
        })

        results.push({ orderId: order.id, success: true })
      } catch (err: any) {
        results.push({ orderId: order.id, success: false, error: err.message })
      }
    }

    const succeeded = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    return NextResponse.json({
      processed: results.length,
      succeeded,
      failed,
      results,
    })
  } catch (error: any) {
    console.error('Bulk order error:', error)
    return NextResponse.json({ error: error.message || 'Failed to process bulk update' }, { status: 500 })
  }
}
