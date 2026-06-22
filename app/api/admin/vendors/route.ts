import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'

/**
 * GET /api/admin/vendors — List vendors with optional search/filter
 * POST /api/admin/vendors — Create a new vendor
 */
export async function GET(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status') // active, inactive, all
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    if (status === 'active') where.isActive = true
    if (status === 'inactive') where.isActive = false
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        include: { _count: { select: { purchaseOrders: true } } },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.vendor.count({ where }),
    ])

    return NextResponse.json({ vendors, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
  } catch (error: any) {
    console.error('Vendors fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const body = await request.json()
    const { name, code, contactName, email, phone, address, city, state, pincode, gstNumber, panNumber, paymentTerms, leadTimeDays, notes } = body

    if (!name || !code) {
      return NextResponse.json({ error: 'Name and code are required' }, { status: 400 })
    }

    const existing = await prisma.vendor.findUnique({ where: { code } })
    if (existing) {
      return NextResponse.json({ error: 'Vendor code already exists' }, { status: 400 })
    }

    const vendor = await prisma.vendor.create({
      data: { name, code, contactName, email, phone, address, city, state, pincode, gstNumber, panNumber, paymentTerms, leadTimeDays, notes },
    })

    return NextResponse.json(vendor, { status: 201 })
  } catch (error: any) {
    console.error('Vendor create error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create vendor' }, { status: 500 })
  }
}
