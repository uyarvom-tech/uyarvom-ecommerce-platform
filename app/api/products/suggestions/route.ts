import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/products/suggestions - Get search suggestions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''

    if (!query.trim() || query.length < 2) {
      return NextResponse.json({ suggestions: [] })
    }

    // Get product names and category names that match the query
    const [products, categories] = await Promise.all([
      // Get product names
      prisma.product.findMany({
        where: {
          isActive: true,
          name: { contains: query }
        },
        select: {
          name: true
        },
        take: 5
      }),
      // Get category names
      prisma.category.findMany({
        where: {
          isActive: true,
          name: { contains: query }
        },
        select: {
          name: true
        },
        take: 3
      })
    ])

    // Combine and format suggestions
    const suggestions = [
      ...products.map(p => ({ text: p.name, type: 'product' })),
      ...categories.map(c => ({ text: c.name, type: 'category' }))
    ]

    // Remove duplicates and limit to 8 suggestions
    const uniqueSuggestions = suggestions
      .filter((item, index, self) => 
        index === self.findIndex(t => t.text.toLowerCase() === item.text.toLowerCase())
      )
      .slice(0, 8)

    return NextResponse.json({ suggestions: uniqueSuggestions })
  } catch (error) {
    console.error('Error fetching suggestions:', error)
    return NextResponse.json({ suggestions: [] })
  }
}