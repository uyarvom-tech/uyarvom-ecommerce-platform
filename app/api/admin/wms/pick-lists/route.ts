import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'
import { generatePickListNumber, optimizePickList, type PickItem } from '@/lib/wms'

/**
 * GET /api/admin/wms/pick-lists — List pick lists
 * POST /api/admin/wms/pick-lists — Generate a pick list from pending orders
 */
export async function GET(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: any = {}
    if (status) where.status = status

    const pickLists = await prisma.pickList.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ pickLists })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch pick lists' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const body = await request.json()
    const { orderIds, warehouseId, assignedTo } = body

    if (!orderIds?.length) {
      return NextResponse.json({ error: 'orderIds array is required' }, { status: 400 })
    }

    // Get order items that need picking
    const orderItems = await prisma.orderItem.findMany({
      where: {
        orderId: { in: orderIds },
        order: { status: { in: ['confirmed', 'processing'] } },
      },
      include: {
        product: { select: { name: true } },
        productVariant: { select: { id: true, sku: true, size: true, color: { select: { colorName: true } } } },
      },
    })

    if (orderItems.length === 0) {
      return NextResponse.json({ error: 'No eligible items found for picking' }, { status: 400 })
    }

    // Build pick items
    const pickItems: PickItem[] = orderItems.map((oi) => ({
      orderItemId: oi.id,
      variantId: oi.productVariantId || '',
      productName: oi.productName || oi.product.name,
      variantLabel: oi.variantName || `${oi.productVariant?.color?.colorName || ''} / ${oi.productVariant?.size || ''}`,
      quantity: oi.quantity,
    }))

    // Optimize the pick list
    const optimized = optimizePickList(pickItems)

    // Create pick list in DB
    const pickNumber = generatePickListNumber()

    const pickList = await prisma.pickList.create({
      data: {
        pickNumber,
        warehouseId: warehouseId || 'default',
        status: assignedTo ? 'assigned' : 'pending',
        assignedTo: assignedTo || null,
        totalItems: optimized.totalItems,
        items: {
          create: optimized.items.map((item) => ({
            orderItemId: item.orderItemId,
            variantId: item.variantId,
            binCode: item.binLocation || null,
            quantity: item.quantity,
            status: 'pending',
          })),
        },
      },
      include: { items: true },
    })

    return NextResponse.json({
      pickList,
      optimization: { estimatedTime: optimized.estimatedTime, zones: optimized.zones, totalQuantity: optimized.totalQuantity },
    }, { status: 201 })
  } catch (error: any) {
    console.error('Pick list generation error:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate pick list' }, { status: 500 })
  }
}
