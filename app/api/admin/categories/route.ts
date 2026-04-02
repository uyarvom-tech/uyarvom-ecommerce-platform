import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// GET /api/admin/categories - List all categories with hierarchy
export async function GET(request: NextRequest) {
  // Check staff access (both admin and staff can view categories)
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) {
    return authResult // Return error response
  }

  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            productCategories: true,
            children: true
          }
        },
        parent: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
            _count: {
              select: {
                productCategories: true
              }
            }
          },
          orderBy: [
            { displayOrder: 'asc' },
            { name: 'asc' }
          ]
        }
      },
      orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' }
      ]
    })

    // Transform categories to include product count and hierarchy info
    const categoriesWithCount = categories.map(category => ({
      ...category,
      productCount: category._count.productCategories,
      subCategoryCount: category._count.children,
      children: category.children.map(child => ({
        ...child,
        productCount: child._count.productCategories
      }))
    }))

    return NextResponse.json({ categories: categoriesWithCount })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

// POST /api/admin/categories - Create new category (main or sub-category)
export async function POST(request: NextRequest) {
  // Check staff access (both admin and staff can create categories)
  const authResult = await requireStaffAccess(request)
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
      displayOrder,
      isActive,
      parentId
    } = data

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      )
    }

    const normalizedSlug = (slug?.trim() || toSlug(name)).toLowerCase()
    const normalizedName = name.trim()

    // Check if slug already exists
    const existingCategory = await prisma.category.findFirst({
      where: {
        OR: [
          { slug: normalizedSlug },
          { name: { equals: normalizedName, mode: 'insensitive' } }
        ]
      }
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category with this name or slug already exists' },
        { status: 400 }
      )
    }

    // If parentId is provided, validate that parent exists
    if (parentId) {
      const parentCategory = await prisma.category.findUnique({
        where: { id: parentId }
      })

      if (!parentCategory) {
        return NextResponse.json(
          { error: 'Parent category not found' },
          { status: 400 }
        )
      }

      // Prevent creating sub-categories of sub-categories (max 2 levels)
      if (parentCategory.parentId) {
        return NextResponse.json(
          { error: 'Cannot create sub-categories of sub-categories. Maximum 2 levels allowed.' },
          { status: 400 }
        )
      }
    }

    // Create category
    const category = await prisma.category.create({
      data: {
        name: normalizedName,
        slug: normalizedSlug,
        description,
        imageUrl,
        displayOrder: Number(displayOrder ?? 0) || 0,
        isActive: isActive ?? true,
        parentId: parentId || null
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true
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

// PUT /api/admin/categories - Update existing category
export async function PUT(request: NextRequest) {
  // Check staff access (both admin and staff can update categories)
  const authResult = await requireStaffAccess(request)
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
      displayOrder,
      isActive,
      parentId
    } = data

    if (!id) {
      return NextResponse.json(
        { error: 'Category id is required' },
        { status: 400 }
      )
    }

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      )
    }

    const normalizedSlug = (slug?.trim() || toSlug(name)).toLowerCase()
    const normalizedName = name.trim()

    // Check if slug already exists for different category
    const existingCategory = await prisma.category.findFirst({
      where: {
        OR: [
          { slug: normalizedSlug },
          { name: { equals: normalizedName, mode: 'insensitive' } }
        ],
        NOT: { id }
      }
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category with this name or slug already exists' },
        { status: 400 }
      )
    }

    // If parentId is provided, validate that parent exists and prevent circular references
    if (parentId) {
      const parentCategory = await prisma.category.findUnique({
        where: { id: parentId }
      })

      if (!parentCategory) {
        return NextResponse.json(
          { error: 'Parent category not found' },
          { status: 400 }
        )
      }

      // Prevent circular references (category cannot be its own parent or grandparent)
      if (parentId === id) {
        return NextResponse.json(
          { error: 'Category cannot be its own parent' },
          { status: 400 }
        )
      }

      // Prevent creating sub-categories of sub-categories (max 2 levels)
      if (parentCategory.parentId) {
        return NextResponse.json(
          { error: 'Cannot create sub-categories of sub-categories. Maximum 2 levels allowed.' },
          { status: 400 }
        )
      }

      // Check if this category has children - if so, it cannot become a sub-category
      const hasChildren = await prisma.category.findFirst({
        where: { parentId: id }
      })

      if (hasChildren) {
        return NextResponse.json(
          { error: 'Categories with sub-categories cannot be moved under another category' },
          { status: 400 }
        )
      }
    }

    // Update category
    const category = await prisma.category.update({
      where: { id },
      data: {
        name: normalizedName,
        slug: normalizedSlug,
        description,
        imageUrl,
        displayOrder: Number(displayOrder ?? 0) || 0,
        isActive: isActive ?? true,
        parentId: parentId || null
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true
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
