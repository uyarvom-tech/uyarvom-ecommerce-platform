import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'
import { generateBinCode } from '@/lib/wms'

/**
 * GET /api/admin/wms/bins — List bins with optional zone/warehouse filter
 * POST /api/admin/wms/bins — Create a new bin location
 */
export async function GET(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { searchParams } = new URL(request.url)
    const warehouseId = searchParams.get('warehouseId')
    const zone = searchParams.get('zone')
    const type = searchParams.get('type')

    const where: any = {}
    if (warehouseId) where.warehouseId = warehouseId
    if (zone) where.zone = zone
    if (type) where.type = type

    const bins = await prisma.warehouseBin.findMany({
      where,
      include: {
        stockAllocations: { include: { variant: { select: { id: true, sku: true, size: true, product: { select: { name: true } } } } } },
        warehouse: { select: { name: true, code: true } },
      },
      orderBy: [{ zone: 'asc' }, { aisle: 'asc' }, { shelf: 'asc' }, { position: 'asc' }],
    })

    return NextResponse.json({ bins, total: bins.length })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch bins' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const body = await request.json()
    const { warehouseId, zone, aisle, shelf, position, type, maxCapacity } = body

    if (!warehouseId || !zone || aisle === undefined || shelf === undefined || position === undefined) {
      return NextResponse.json({ error: 'warehouseId, zone, aisle, shelf, position are required' }, { status: 400 })
    }

    const code = generateBinCode(zone, aisle, shelf, position)

    const existing = await prisma.warehouseBin.findUnique({ where: { code } })
    if (existing) {
      return NextResponse.json({ error: `Bin ${code} already exists` }, { status: 400 })
    }

    const bin = await prisma.warehouseBin.create({
      data: { warehouseId, code, zone: zone.toUpperCase(), aisle, shelf, position, type: type || 'storage', maxCapacity },
    })

    return NextResponse.json(bin, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create bin' }, { status: 500 })
  }
}
