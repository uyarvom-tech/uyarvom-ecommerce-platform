import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidTrackingTransition, type ShipmentStatus } from '@/lib/shipping'
import crypto from 'crypto'

/**
 * POST /api/admin/shipping/webhook — Receive tracking updates from carriers
 * Validates request using HMAC signature from X-Webhook-Signature header.
 * If SHIPPING_WEBHOOK_SECRET is not set, falls back to admin auth via middleware.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature if secret is configured
    const webhookSecret = process.env.SHIPPING_WEBHOOK_SECRET
    if (webhookSecret) {
      const signature = request.headers.get('x-webhook-signature') || ''
      const rawBody = await request.clone().text()
      const expectedSig = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex')

      if (!signature || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })
      }
    }
    // If no webhook secret configured, the route relies on middleware admin auth (default behavior)

    const body = await request.json()
    const { awb, status, location, description, timestamp } = body

    if (!awb || !status) {
      return NextResponse.json({ error: 'awb and status are required' }, { status: 400 })
    }

    const shipment = await prisma.shipment.findUnique({ where: { awb } })
    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 })
    }

    // Validate transition
    if (!isValidTrackingTransition(shipment.status as ShipmentStatus, status as ShipmentStatus)) {
      return NextResponse.json({ error: `Invalid status transition: ${shipment.status} → ${status}` }, { status: 400 })
    }

    // Update shipment + add tracking event
    const updateData: any = { status }
    if (status === 'delivered') updateData.deliveredAt = new Date()

    await prisma.$transaction([
      prisma.shipment.update({ where: { awb }, data: updateData }),
      prisma.shipmentTracking.create({
        data: {
          shipmentId: shipment.id,
          status,
          location: location || null,
          description: description || `Status updated to ${status}`,
          timestamp: timestamp ? new Date(timestamp) : new Date(),
        },
      }),
    ])

    // Update order status if delivered
    if (status === 'delivered') {
      await prisma.order.update({
        where: { id: shipment.orderId },
        data: { status: 'delivered', deliveredAt: new Date() },
      })
    }

    return NextResponse.json({ success: true, awb, status })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
