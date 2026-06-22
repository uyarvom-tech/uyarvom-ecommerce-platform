import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess, requireAdminRole } from '@/lib/auth-middleware'

// GET /api/admin/categories/[id] - Get single category
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check staff access (both admin and staff can view categories)
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) {
    return authResult // Return error response
  }

  try {
    const { id } = await params

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            productCategories: true
          }
        }
      }
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Transform category to include product count
    const categoryWithCount = {
      ...category,
      productCount: category._count.productCategories
    }

    return NextResponse.json(categoryWithCount)
  } catch (error) {
    console.error('Error fetching category:', error)
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/categories/[id] - Delete single category (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check admin role (only admins can delete categories directly)
  const authResult = await requireAdminRole(request)
  if (authResult instanceof NextResponse) {
    return authResult // Return error response
  }

  try {
    const { id } = await params

    // Check if category exists and has products
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            productCategories: true,
            children: true
          }
        }
      }
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    if (category._count.children > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with subcategories. Please move or delete child categories first.' },
        { status: 400 }
      )
    }

    await prisma.$transaction([
      prisma.productCategory.deleteMany({
        where: { categoryId: id }
      }),
      prisma.category.delete({
        where: { id }
      })
    ])

    if (category._count.productCategories > 0) {
      return NextResponse.json(
        { message: 'Category deleted successfully. Product links were removed.' }
      )
    }

    return NextResponse.json({ message: 'Category deleted successfully' })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/categories/[id] - Update category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, imageUrl, displayOrder, isActive } = body

    const category = await prisma.category.findUnique({ where: { id } })
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: name ?? category.name,
        description: description !== undefined ? description : category.description,
        imageUrl: imageUrl !== undefined ? imageUrl : category.imageUrl,
        displayOrder: displayOrder !== undefined ? displayOrder : category.displayOrder,
        isActive: isActive !== undefined ? isActive : category.isActive,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}
