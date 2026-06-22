import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'
import { validateTransfer } from '@/lib/inventory'

/**
 * GET /api/admin/inventory/transfers — List all transfers
 * POST /api/admin/inventory/transfers — Create a new stock transfer
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

    const [transfers, total] = await Promise.all([
      prisma.stockTransfer.findMany({
        where,
        include: {
          sourceWarehouse: { select: { id: true, name: true, code: true } },
          destinationWarehouse: { select: { id: true, name: true, code: true } },
          items: {
            include: {
              variant: {
                select: {
                  id: true,
                  sku: true,
                  size: true,
                  product: { select: { name: true } },
                  color: { select: { colorName: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.stockTransfer.count({ where }),
    ])

    return NextResponse.json({
      transfers,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error: any) {
    console.error('Transfers fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch transfers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const body = await request.json()
    const { sourceWarehouseId, destinationWarehouseId, items, notes } = body

    if (!sourceWarehouseId || !destinationWarehouseId || !items?.length) {
      return NextResponse.json(
        { error: 'sourceWarehouseId, destinationWarehouseId, and items are required' },
        { status: 400 }
      )
    }

    if (sourceWarehouseId === destinationWarehouseId) {
      return NextResponse.json(
        { error: 'Source and destination warehouses must be different' },
        { status: 400 }
      )
    }

    // Validate both warehouses exist
    const [source, destination] = await Promise.all([
      prisma.warehouse.findUnique({ where: { id: sourceWarehouseId } }),
      prisma.warehouse.findUnique({ where: { id: destinationWarehouseId } }),
    ])

    if (!source) return NextResponse.json({ error: 'Source warehouse not found' }, { status: 404 })
    if (!destination) return NextResponse.json({ error: 'Destination warehouse not found' }, { status: 404 })

    // Validate each item has sufficient stock
    for (const item of items) {
      if (!item.variantId || !item.quantity || item.quantity <= 0) {
        return NextResponse.json({ error: 'Each item needs variantId and positive quantity' }, { status: 400 })
      }

      const variant = await prisma.productVariant.findUnique({
        where: { id: item.variantId },
        select: { stock: true },
      })

      if (!variant) {
        return NextResponse.json({ error: `Variant ${item.variantId} not found` }, { status: 404 })
      }

      const validation = validateTransfer(variant.stock, item.quantity, sourceWarehouseId, destinationWarehouseId)
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 })
      }
    }

    // Create transfer
    const transferNumber = `TRF-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

    const transfer = await prisma.stockTransfer.create({
      data: {
        transferNumber,
        sourceWarehouseId,
        destinationWarehouseId,
        status: 'pending',
        notes: notes || null,
        initiatedBy: (authResult as any).userId || null,
        items: {
          create: items.map((item: any) => ({
            variantId: item.variantId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        sourceWarehouse: { select: { name: true, code: true } },
        destinationWarehouse: { select: { name: true, code: true } },
        items: true,
      },
    })

    return NextResponse.json(transfer, { status: 201 })
  } catch (error: any) {
    console.error('Transfer create error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create transfer' }, { status: 500 })
  }
}
