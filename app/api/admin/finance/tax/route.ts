import { NextRequest, NextResponse } from 'next/server'
import { requireStaffAccess } from '@/lib/auth-middleware'
import { calculateGST } from '@/lib/finance'

/**
 * GET /api/admin/finance/tax?amount=1000&rate=18&interstate=false
 * Standalone tax calculation API.
 */
export async function GET(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { searchParams } = new URL(request.url)
    const amount = parseFloat(searchParams.get('amount') || '0')
    const rate = parseFloat(searchParams.get('rate') || '18')
    const interstate = searchParams.get('interstate') === 'true'

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Positive amount is required' }, { status: 400 })
    }

    const gst = calculateGST(amount, rate, interstate)
    return NextResponse.json(gst)
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to calculate tax' }, { status: 500 })
  }
}
