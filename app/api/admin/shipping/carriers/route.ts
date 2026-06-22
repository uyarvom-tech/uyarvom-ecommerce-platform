import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'

/**
 * GET /api/admin/shipping/carriers — List carriers
 * POST /api/admin/shipping/carriers — Create/configure a carrier
 */
export async function GET(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const carriers = await prisma.shippingCarrier.findMany({ orderBy: { name: 'asc' } })
    return NextResponse.json({ carriers })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch carriers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const body = await request.json()
    const { name, code, baseRate, perKgRate, codAvailable, codCharge, localDays, regionalDays, nationalDays } = body

    if (!name || !code) {
      return NextResponse.json({ error: 'Name and code are required' }, { status: 400 })
    }

    const existing = await prisma.shippingCarrier.findUnique({ where: { code } })
    if (existing) {
      return NextResponse.json({ error: 'Carrier code already exists' }, { status: 400 })
    }

    const carrier = await prisma.shippingCarrier.create({
      data: { name, code, baseRate: baseRate || 40, perKgRate: perKgRate || 20, codAvailable: codAvailable ?? true, codCharge: codCharge || 30, localDays: localDays || 3, regionalDays: regionalDays || 5, nationalDays: nationalDays || 7 },
    })

    return NextResponse.json(carrier, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create carrier' }, { status: 500 })
  }
}
