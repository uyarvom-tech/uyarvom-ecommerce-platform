import { NextRequest, NextResponse } from 'next/server'
import { requireStaffAccess } from '@/lib/auth-middleware'
import { getAllRates, getDeliveryZone, DEFAULT_CARRIERS, type DeliveryZone } from '@/lib/shipping'

/**
 * GET /api/admin/shipping/rates — Compare shipping rates across carriers
 * Query: weight (grams), originState, destState, originCity, destCity, cod (true/false)
 */
export async function GET(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { searchParams } = new URL(request.url)
    const weight = parseInt(searchParams.get('weight') || '500')
    const originState = searchParams.get('originState') || 'Tamil Nadu'
    const destState = searchParams.get('destState') || 'Tamil Nadu'
    const originCity = searchParams.get('originCity') || 'Chennai'
    const destCity = searchParams.get('destCity') || ''
    const isCOD = searchParams.get('cod') === 'true'

    if (weight <= 0) {
      return NextResponse.json({ error: 'Weight must be positive' }, { status: 400 })
    }

    const zone = getDeliveryZone(originState, destState, originCity, destCity)
    const rates = getAllRates(DEFAULT_CARRIERS, weight, zone, isCOD)

    return NextResponse.json({ zone, weight, isCOD, rates })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to calculate rates' }, { status: 500 })
  }
}
