import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'
import { calculatePointsEarned, getTierFromPoints, type LoyaltyTier } from '@/lib/crm'

/**
 * GET /api/admin/loyalty?userId= — Get loyalty account for a user
 * POST /api/admin/loyalty — Award/deduct points
 */
export async function GET(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    let account = await prisma.loyaltyAccount.findUnique({
      where: { userId },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 20 } },
    })

    // Auto-create account if none exists
    if (!account) {
      account = await prisma.loyaltyAccount.create({
        data: { userId, currentPoints: 0, lifetimePoints: 0, tier: 'bronze' },
        include: { transactions: true },
      })
    }

    return NextResponse.json(account)
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch loyalty account' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { userId, type, points, description, reference } = await request.json()

    if (!userId || !type || !points) {
      return NextResponse.json({ error: 'userId, type, and points are required' }, { status: 400 })
    }

    if (!['earned', 'redeemed', 'expired', 'adjusted'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type. Must be: earned, redeemed, expired, adjusted' }, { status: 400 })
    }

    // Get or create account
    let account = await prisma.loyaltyAccount.findUnique({ where: { userId } })
    if (!account) {
      account = await prisma.loyaltyAccount.create({ data: { userId, currentPoints: 0, lifetimePoints: 0, tier: 'bronze' } })
    }

    const pointsValue = type === 'redeemed' || type === 'expired' ? -Math.abs(points) : Math.abs(points)

    // Validate redemption
    if (pointsValue < 0 && account.currentPoints < Math.abs(pointsValue)) {
      return NextResponse.json({ error: `Insufficient points. Available: ${account.currentPoints}` }, { status: 400 })
    }

    // Update account
    const newCurrentPoints = account.currentPoints + pointsValue
    const newLifetimePoints = pointsValue > 0 ? account.lifetimePoints + pointsValue : account.lifetimePoints
    const newTier = getTierFromPoints(newLifetimePoints)
    const newRedeemed = pointsValue < 0 ? account.redeemedPoints + Math.abs(pointsValue) : account.redeemedPoints

    const updated = await prisma.$transaction(async (tx) => {
      const updatedAccount = await tx.loyaltyAccount.update({
        where: { userId },
        data: { currentPoints: newCurrentPoints, lifetimePoints: newLifetimePoints, tier: newTier, redeemedPoints: newRedeemed },
      })

      await tx.loyaltyTransaction.create({
        data: { accountId: updatedAccount.id, type, points: pointsValue, description: description || null, reference: reference || null },
      })

      return updatedAccount
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Loyalty error:', error)
    return NextResponse.json({ error: error.message || 'Failed to process loyalty transaction' }, { status: 500 })
  }
}
