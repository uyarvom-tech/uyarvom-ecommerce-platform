import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'

/**
 * GET /api/admin/coupons — List coupons
 * POST /api/admin/coupons — Create a coupon
 */
export async function GET(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // active, expired, all

    const now = new Date()
    const where: any = {}
    if (status === 'active') { where.isActive = true; where.endDate = { gte: now } }
    if (status === 'expired') { where.endDate = { lt: now } }

    const coupons = await prisma.coupon.findMany({ where, orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ coupons })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const body = await request.json()
    const { code, type, value, minOrderAmount, maxDiscount, usageLimit, perUserLimit, startDate, endDate, description } = body

    if (!code || !type || value === undefined || !startDate || !endDate) {
      return NextResponse.json({ error: 'code, type, value, startDate, endDate are required' }, { status: 400 })
    }

    const existing = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } })
    if (existing) {
      return NextResponse.json({ error: 'Coupon code already exists' }, { status: 400 })
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        type, value,
        minOrderAmount: minOrderAmount || 0,
        maxDiscount: maxDiscount || 0,
        usageLimit: usageLimit || 0,
        perUserLimit: perUserLimit || 1,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        description,
        createdBy: (authResult as any).userId,
      },
    })

    return NextResponse.json(coupon, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create coupon' }, { status: 500 })
  }
}
