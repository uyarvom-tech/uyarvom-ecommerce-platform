import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'
import { validatePack, generateShippingLabel } from '@/lib/wms'

/**
 * POST /api/admin/wms/pack — Confirm packing for an order
 * Records weight, dimensions, item verification, and generates shipping label.
 */
export async function POST(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const body = await request.json()
    const { orderId, weight, length, width, height, items, courierName, trackingNumber } = body

    if (!orderId || !items?.length) {
      return NextResponse.json({ error: 'orderId and items are required' }, { status: 400 })
    }

    // Validate pack
    const validation = validatePack({ orderId, weight: weight || 0, length: length || 0, width: width || 0, height: height || 0, items })
    if (!validation.valid) {
      return NextResponse.json({ error: validation.errors.join('; '), warnings: validation.warnings }, { status: 400 })
    }

    // Get order for shipping label
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, orderNumber: true, shippingName: true, shippingAddress1: true, shippingCity: true, shippingState: true, shippingZip: true, shippingPhone: true, paymentMethod: true, total: true },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Generate shipping label
    const label = generateShippingLabel({
      orderNumber: order.orderNumber,
      customerName: order.shippingName,
      address: order.shippingAddress1,
      city: order.shippingCity,
      state: order.shippingState,
      pincode: order.shippingZip,
      phone: order.shippingPhone || '',
      weight: weight || 0,
      courierName,
      trackingNumber,
      codAmount: order.paymentMethod === 'cod' ? order.total : undefined,
    })

    // Create pack session
    const packSession = await prisma.packSession.create({
      data: {
        orderId,
        status: 'packed',
        weight,
        length,
        width,
        height,
        packedBy: (authResult as any).userId,
        verifiedAt: new Date(),
        courierName: courierName || null,
        trackingNumber: trackingNumber || null,
        labelData: JSON.stringify(label),
        items: {
          create: items.map((item: any) => ({
            variantId: item.variantId,
            quantity: item.quantity,
            verified: item.verified ?? true,
          })),
        },
      },
      include: { items: true },
    })

    return NextResponse.json({
      packSession,
      shippingLabel: label,
      warnings: validation.warnings,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Pack error:', error)
    return NextResponse.json({ error: error.message || 'Failed to pack order' }, { status: 500 })
  }
}
