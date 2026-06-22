import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'

/**
 * GET /api/admin/returns — List return requests with filters
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

    const [returns, total] = await Promise.all([
      prisma.returnRequest.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.returnRequest.count({ where }),
    ])

    return NextResponse.json({ returns, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch returns' }, { status: 500 })
  }
}
