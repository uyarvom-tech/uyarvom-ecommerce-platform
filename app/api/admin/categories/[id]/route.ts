import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-middleware'

// GET /api/admin/categories/[id] - Get single category
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check admin access
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) {
    return authResult // Return error response
  }

  try {
    const { id } = await params

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: {
          orderBy: [
            { displayOrder: 'asc' },
            { name: 'asc' }
          ]
        },
        productCategories: {
          include: {
            product: {
              include: {
                images: {
                  where: { isPrimary: true }
                }
              }
            }
          }
        },
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

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error fetching category:', error)
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/categories/[id] - Delete category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check admin access
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) {
    return authResult // Return error response
  }

  try {
    const { id } = await params

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
        productCategories: true
      }
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Check if category has children
    if (category.children.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with subcategories. Please delete or move subcategories first.' },
        { status: 400 }
      )
    }

    // Check if category has products
    if (category.productCategories.length > 0) {
      return NextResponse.json(
        { error: `Cannot delete category with ${category.productCategories.length} products. Please move products to other categories first.` },
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