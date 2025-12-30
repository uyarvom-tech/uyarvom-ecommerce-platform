import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('🔍 DEBUG: Fetching products for admin...')
    
    const products = await prisma.product.findMany({
      include: {
        productCategories: {
          include: { category: true },
          orderBy: { isPrimary: 'desc' }
        },
        images: {
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 3
    })
    
    console.log('🔍 DEBUG: Raw products from DB:', products.length)
    
    // Transform products to include categories array
    const transformedProducts = products.map(product => ({
      ...product,
      categories: product.productCategories.map(pc => pc.category),
      primaryCategory: product.productCategories.find(pc => pc.isPrimary)?.category || product.productCategories[0]?.category,
      // Keep backward compatibility
      category: product.productCategories.find(pc => pc.isPrimary)?.category || product.productCategories[0]?.category
    }))
    
    console.log('🔍 DEBUG: Transformed products:', transformedProducts.length)
    
    return NextResponse.json({
      debug: 'Admin products API debug',
      rawProductsCount: products.length,
      transformedProductsCount: transformedProducts.length,
      sampleProduct: transformedProducts[0] ? {
        id: transformedProducts[0].id,
        name: transformedProducts[0].name,
        categories: transformedProducts[0].categories,
        primaryCategory: transformedProducts[0].primaryCategory,
        category: transformedProducts[0].category,
        productCategories: transformedProducts[0].productCategories
      } : null,
      allProducts: transformedProducts.map(p => ({
        id: p.id,
        name: p.name,
        categories: p.categories,
        category: p.category,
        categoryCount: p.categories?.length || 0
      }))
    })
  } catch (error) {
    console.error('DEBUG API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}