import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-middleware'

// GET /api/admin/categories - List all categories with hierarchy
export async function GET(request: NextRequest) {
  console.log('Categories API called')
  
  // Check admin access
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) {
    console.log('Auth failed:', authResult)
    return authResult // Return error response
  }

  console.log('Auth passed, fetching categories...')

  try {
    const { searchParams } = new URL(request.url)
    const includeProducts = searchParams.get('includeProducts') === 'true'
    const flat = searchParams.get('flat') === 'true'

    if (flat) {
      // Return flat list for dropdowns
      const categories = await prisma.category.findMany({
        where: { isActive: true },
        orderBy: [
          { displayOrder: 'asc' },
          { name: 'asc' }
        ],
        include: includeProducts ? {
          productCategories: {
            include: { product: true }
          }
        } : undefined
      })

      console.log('Flat categories found:', categories.length)
      return NextResponse.json({ categories })
    }

    // Return hierarchical structure
    const allCategories = await prisma.category.findMany({
      orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' }
      ],
      include: {
        children: {
          orderBy: [
            { displayOrder: 'asc' },
            { name: 'asc' }
          ]
        },
        productCategories: includeProducts ? {
          include: { product: true }
        } : undefined,
        _count: {
          select: {
            productCategories: true,
            children: true
          }
        }
      }
    })

    // Filter to get only root categories (no parent)
    const rootCategories = allCategories.filter(cat => !cat.parentId)

    console.log('All categories found:', allCategories.length)
    console.log('Root categories found:', rootCategories.length)

    return NextResponse.json({ 
      categories: rootCategories,
      total: allCategories.length 
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

// POST /api/admin/categories - Create new category
export async function POST(request: NextRequest) {
  // Check admin access
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) {
    return authResult // Return error response
  }

  try {
    const data = await request.json()
    
    const {
      name,
      slug,
      description,
      imageUrl,
      parentId,
      displayOrder,
      isActive = true
    } = data

    // Check if slug already exists
    const existingCategory = await prisma.category.findUnique({
      where: { slug }
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category with this slug already exists' },
        { status: 400 }
      )
    }

    // If no display order provided, set it to the next available
    let finalDisplayOrder = displayOrder
    if (finalDisplayOrder === undefined) {
      const lastCategory = await prisma.category.findFirst({
        where: { parentId },
        orderBy: { displayOrder: 'desc' }
      })
      finalDisplayOrder = (lastCategory?.displayOrder || 0) + 1
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        imageUrl,
        parentId,
        displayOrder: finalDisplayOrder,
        isActive
      },
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            productCategories: true,
            children: true
          }
        }
      }
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/categories - Update category
export async function PUT(request: NextRequest) {
  // Check admin access
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) {
    return authResult // Return error response
  }

  try {
    const data = await request.json()
    
    const {
      id,
      name,
      slug,
      description,
      imageUrl,
      parentId,
      displayOrder,
      isActive
    } = data

    // Check if slug already exists for different category
    const existingCategory = await prisma.category.findFirst({
      where: {
        slug,
        NOT: { id }
      }
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category with this slug already exists' },
        { status: 400 }
      )
    }

    // Prevent category from being its own parent
    if (parentId === id) {
      return NextResponse.json(
        { error: 'Category cannot be its own parent' },
        { status: 400 }
      )
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name,
        slug,
        description,
        imageUrl,
        parentId,
        displayOrder,
        isActive
      },
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            productCategories: true,
            children: true
          }
        }
      }
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    )
  }
}