import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'

/**
 * GET /api/admin/affiliates — List affiliates
 * POST /api/admin/affiliates — Create affiliate
 */
export async function GET(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const affiliates = await prisma.affiliate.findMany({
      include: { _count: { select: { referrals: true } } },
      orderBy: { totalEarnings: 'desc' },
    })
    return NextResponse.json({ affiliates })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch affiliates' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { name, email, code, commissionRate } = await request.json()

    if (!name || !email || !code) {
      return NextResponse.json({ error: 'name, email, code are required' }, { status: 400 })
    }

    const existing = await prisma.affiliate.findFirst({ where: { OR: [{ email }, { code }] } })
    if (existing) {
      return NextResponse.json({ error: 'Email or code already exists' }, { status: 400 })
    }

    const affiliate = await prisma.affiliate.create({
      data: { name, email, code: code.toUpperCase(), commissionRate: commissionRate || 5 },
    })

    return NextResponse.json(affiliate, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create affiliate' }, { status: 500 })
  }
}
