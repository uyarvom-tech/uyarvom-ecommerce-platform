import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateCoupon, calculateCouponDiscount } from '@/lib/promotions'
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit'

/**
 * POST /api/coupons/validate — Validate a coupon code (public, for checkout)
 * Body: { code, cartTotal, userId? }
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit public endpoint
    const ip = getClientIP(request)
    const rateCheck = checkRateLimit(`coupon:${ip}`, RATE_LIMITS.public)
    if (rateCheck.limited) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfter) } }
      )
    }

    const { code, cartTotal, userId } = await request.json()

    if (!code || !cartTotal) {
      return NextResponse.json({ error: 'code and cartTotal are required' }, { status: 400 })
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    })

    if (!coupon) {
      return NextResponse.json({ valid: false, error: 'Invalid coupon code' }, { status: 200 })
    }

    // Count user usage if userId provided
    let userUsageCount = 0
    if (userId) {
      userUsageCount = await prisma.couponUsage.count({
        where: { couponId: coupon.id, userId },
      })
    }

    const validation = validateCoupon(coupon as any, cartTotal, userUsageCount)

    return NextResponse.json(validation)
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to validate coupon' }, { status: 500 })
  }
}
