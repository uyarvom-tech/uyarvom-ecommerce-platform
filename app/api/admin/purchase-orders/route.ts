import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'
import { generatePONumber, calculatePOTotals } from '@/lib/procurement'

/**
 * GET /api/admin/purchase-orders — List POs with filters
 * POST /api/admin/purchase-orders — Create a new PO
 */
export async function GET(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const vendorId = searchParams.get('vendorId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: any = {}
    if (status) where.status = status
    if (vendorId) where.vendorId = vendorId

    const [purchaseOrders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: {
          vendor: { select: { id: true, name: true, code: true } },
          _count: { select: { lineItems: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.purchaseOrder.count({ where }),
    ])

    return NextResponse.json({
      purchaseOrders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error: any) {
    console.error('PO fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch purchase orders' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const body = await request.json()
    const { vendorId, items, notes, expectedDeliveryDate } = body

    if (!vendorId || !items?.length) {
      return NextResponse.json({ error: 'vendorId and items are required' }, { status: 400 })
    }

    // Validate vendor exists
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } })
    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    // Validate items
    for (const item of items) {
      if (!item.variantId || !item.quantity || item.quantity <= 0 || !item.unitPrice) {
        return NextResponse.json({ error: 'Each item needs variantId, positive quantity, and unitPrice' }, { status: 400 })
      }
    }

    // Calculate totals
    const totals = calculatePOTotals(items)

    const poNumber = generatePONumber()

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        vendorId,
        status: 'draft',
        subtotal: totals.subtotal,
        discount: totals.totalDiscount,
        tax: totals.totalTax,
        total: totals.grandTotal,
        notes: notes || null,
        expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
        createdBy: (authResult as any).userId,
        lineItems: {
          create: items.map((item: any) => ({
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount || 0,
            tax: item.tax || 0,
            lineTotal: item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100) * (1 + (item.tax || 0) / 100),
          })),
        },
      },
      include: {
        vendor: { select: { name: true, code: true } },
        lineItems: true,
      },
    })

    return NextResponse.json(purchaseOrder, { status: 201 })
  } catch (error: any) {
    console.error('PO create error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create purchase order' }, { status: 500 })
  }
}
