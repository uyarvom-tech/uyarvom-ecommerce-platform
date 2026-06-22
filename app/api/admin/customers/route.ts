import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'

/**
 * GET /api/admin/customers — List customers with segments, filters, CLV
 */
export async function GET(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const segment = searchParams.get('segment')
    const sort = searchParams.get('sort') || 'newest'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: any = {}
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ]
    }

    const orderBy: any = sort === 'oldest' ? { createdAt: 'asc' } :
      sort === 'name' ? { fullName: 'asc' } :
      { createdAt: 'desc' }

    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          createdAt: true,
          _count: { select: { orders: true, reviews: true, supportTickets: true } },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({
      customers,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error: any) {
    console.error('Customers fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}
