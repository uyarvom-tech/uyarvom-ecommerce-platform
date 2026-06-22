import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'
import { generateAWB } from '@/lib/shipping'

/**
 * GET /api/admin/shipping/shipments — List shipments with filters
 * POST /api/admin/shipping/shipments — Create a shipment for an order
 */
export async function GET(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: any = {}
    if (status) where.status = status

    const [shipments, total] = await Promise.all([
      prisma.shipment.findMany({
        where,
        include: { carrier: { select: { name: true, code: true } }, trackingEvents: { orderBy: { timestamp: 'desc' }, take: 3 } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.shipment.count({ where }),
    ])

    return NextResponse.json({ shipments, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch shipments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { orderId, carrierCode, weight, length, width, height, codAmount, pickupDate } = await request.json()

    if (!orderId || !carrierCode) {
      return NextResponse.json({ error: 'orderId and carrierCode are required' }, { status: 400 })
    }

    const carrier = await prisma.shippingCarrier.findUnique({ where: { code: carrierCode } })
    if (!carrier) {
      return NextResponse.json({ error: 'Carrier not found' }, { status: 404 })
    }

    const awb = generateAWB(carrierCode)

    const shipment = await prisma.shipment.create({
      data: {
        orderId,
        carrierId: carrier.id,
        awb,
        status: 'created',
        weight, length, width, height,
        codAmount: codAmount || null,
        pickupDate: pickupDate ? new Date(pickupDate) : null,
        trackingEvents: {
          create: { status: 'created', description: `Shipment created. AWB: ${awb}`, location: 'Warehouse' },
        },
      },
      include: { carrier: { select: { name: true, code: true } } },
    })

    // Update order with tracking info
    await prisma.order.update({
      where: { id: orderId },
      data: { trackingNumber: awb, courierName: carrier.name },
    })

    return NextResponse.json(shipment, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create shipment' }, { status: 500 })
  }
}
