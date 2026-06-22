import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'

/**
 * GET /api/admin/inventory/warehouses — List all warehouses
 * POST /api/admin/inventory/warehouses — Create a new warehouse
 */
export async function GET(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const warehouses = await prisma.warehouse.findMany({
      include: {
        _count: { select: { warehouseStocks: true } },
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    })

    return NextResponse.json({ warehouses })
  } catch (error: any) {
    console.error('Warehouses fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch warehouses' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const body = await request.json()
    const { name, code, address, city, state, pincode, phone, isDefault } = body

    if (!name || !code) {
      return NextResponse.json({ error: 'Name and code are required' }, { status: 400 })
    }

    // Check code uniqueness
    const existing = await prisma.warehouse.findUnique({ where: { code } })
    if (existing) {
      return NextResponse.json({ error: 'Warehouse code already exists' }, { status: 400 })
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.warehouse.updateMany({ where: { isDefault: true }, data: { isDefault: false } })
    }

    const warehouse = await prisma.warehouse.create({
      data: { name, code, address, city, state, pincode, phone, isDefault: isDefault || false },
    })

    return NextResponse.json(warehouse, { status: 201 })
  } catch (error: any) {
    console.error('Warehouse create error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create warehouse' }, { status: 500 })
  }
}
