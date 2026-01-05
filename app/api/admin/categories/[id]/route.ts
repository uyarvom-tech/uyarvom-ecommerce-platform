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
            productCategories: true
          }
        }
      }
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    if (category._count.productCategories > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with products. Please move products to other categories first.' },
        { status: 400 }
      )
    }

    // Delete the category
    await prisma.category.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Category deleted successfully' })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}