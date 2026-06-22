import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'

/**
 * GET /api/admin/products/export
 * Export all products as CSV.
 * Query params: format=csv (default), status=active|inactive|all
 */
export async function GET(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const format = searchParams.get('format') || 'csv'

    const where: any = {}
    if (status === 'active') where.isActive = true
    if (status === 'inactive') where.isActive = false

    const products = await prisma.product.findMany({
      where,
      include: {
        productCategories: {
          include: { category: { include: { parent: true } } },
          orderBy: { isPrimary: 'desc' },
        },
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        colors: {
          include: {
            variants: { orderBy: { sortOrder: 'asc' } },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (format === 'json') {
      return NextResponse.json({ products, count: products.length })
    }

    // CSV export
    const headers = [
      'SKU',
      'Name',
      'Slug',
      'Short Description',
      'Long Description',
      'Price',
      'Compare At Price',
      'Buying Price',
      'Stock Quantity',
      'Low Stock Threshold',
      'Weight',
      'Main Category',
      'Sub Category',
      'Is Active',
      'Is Featured',
      'Supplier',
      'Location',
      'MOQ',
      'BIS',
      'Primary Image URL',
      'Colors',
      'Total Variant Stock',
      'Created At',
    ]

    const rows = products.map((product) => {
      const primaryCategory = product.productCategories.find((pc) => pc.isPrimary)?.category
      const mainCategory = primaryCategory?.parent?.name || primaryCategory?.name || ''
      const subCategory = primaryCategory?.parent ? primaryCategory.name : ''
      const primaryImage = product.images[0]?.imageUrl || ''
      const colorNames = product.colors.map((c) => c.colorName).join('; ')
      const totalVariantStock = product.colors.reduce(
        (sum, c) => sum + c.variants.reduce((vs, v) => vs + (v.stock || 0), 0),
        0
      )

      return [
        product.sku || '',
        product.name,
        product.slug,
        product.shortDescription || '',
        product.description || '',
        product.price,
        product.compareAtPrice || '',
        product.buyingPrice || '',
        product.stockQuantity,
        product.lowStockThreshold,
        product.weight || '',
        mainCategory,
        subCategory,
        product.isActive ? 'Yes' : 'No',
        product.isFeatured ? 'Yes' : 'No',
        product.supplier || '',
        product.location || '',
        product.moq || '',
        product.bis || '',
        primaryImage,
        colorNames,
        totalVariantStock,
        product.createdAt.toISOString(),
      ]
    })

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => {
          const str = String(cell)
          // Escape cells containing commas, quotes, or newlines
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`
          }
          return str
        }).join(',')
      ),
    ].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="uyarvom-products-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Failed to export products' }, { status: 500 })
  }
}
