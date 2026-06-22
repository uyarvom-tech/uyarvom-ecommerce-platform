import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'
import { generateProductBarcode } from '@/lib/barcode'

/**
 * GET /api/admin/products/[id]/barcode
 * Returns barcode data (EAN-13 + QR SVGs) for a product.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params

  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, name: true, sku: true, slug: true },
  })

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  if (!product.sku) {
    return NextResponse.json({ error: 'Product has no SKU assigned' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
  const productUrl = `${appUrl}/products/${product.slug}`

  const barcodeData = generateProductBarcode(product.sku, productUrl)

  return NextResponse.json({
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    ...barcodeData,
  })
}
