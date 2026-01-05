import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess, requireAdminRole } from '@/lib/auth-middleware'

// GET /api/admin/products/[id] - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check staff access (both admin and staff can view products)
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) {
    return authResult // Return error response
  }

  try {
    const { id } = await params

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        productCategories: {
          include: {
            category: true
          },
          orderBy: { isPrimary: 'desc' }
        },
        images: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Transform product to include categories array
    const transformedProduct = {
      ...product,
      categories: product.productCategories.map(pc => pc.category),
      primaryCategory: product.productCategories.find(pc => pc.isPrimary)?.category,
      categoryIds: product.productCategories.map(pc => pc.categoryId) // For form compatibility
    }

    return NextResponse.json(transformedProduct)
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/products/[id] - Update single product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check staff access (both admin and staff can update products)
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) {
    return authResult // Return error response
  }

  try {
    const { id } = await params
    const data = await request.json()

    console.log('🔄 Updating product:', id)
    console.log('📦 Update data:', data)

    const {
      name,
      slug,
      description,
      shortDescription,
      price,
      compareAtPrice,
      stockQuantity,
      lowStockThreshold,
      sku,
      weight,
      categoryIds,
      isActive,
      isFeatured,
      images
    } = data

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
        productCategories: true
      }
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check if slug is unique (excluding current product)
    if (slug !== existingProduct.slug) {
      const existingSlug = await prisma.product.findFirst({
        where: {
          slug,
          NOT: { id }
        }
      })

      if (existingSlug) {
        return NextResponse.json(
          { error: 'Product with this slug already exists' },
          { status: 400 }
        )
      }
    }

    // Use transaction to update product, categories, and images
    const updatedProduct = await prisma.$transaction(async (tx) => {
      // Update product basic info
      const product = await tx.product.update({
        where: { id },
        data: {
          name,
          slug,
          description,
          shortDescription,
          price,
          compareAtPrice,
          stockQuantity,
          lowStockThreshold,
          sku,
          weight,
          isActive,
          isFeatured
        }
      })

      // Update categories
      if (categoryIds && Array.isArray(categoryIds)) {
        // Delete existing category relationships
        await tx.productCategory.deleteMany({
          where: { productId: id }
        })

        // Create new category relationships
        if (categoryIds.length > 0) {
          await tx.productCategory.createMany({
            data: categoryIds.map((categoryId: string, index: number) => ({
              productId: id,
              categoryId,
              isPrimary: index === 0 // First category is primary
            }))
          })
        }
      }

      // Update images if provided
      if (images && Array.isArray(images)) {
        console.log('🖼️ Updating images:', images)

        // Delete existing images
        await tx.productImage.deleteMany({
          where: { productId: id }
        })

        // Create new images
        if (images.length > 0) {
          await tx.productImage.createMany({
            data: images.map((img: any, index: number) => ({
              productId: id,
              imageUrl: img.imageUrl,
              altText: img.altText || '',
              isPrimary: img.isPrimary || index === 0,
              sortOrder: img.sortOrder !== undefined ? img.sortOrder : index
            }))
          })
        }
      }

      // Return updated product with relations
      return await tx.product.findUnique({
        where: { id },
        include: {
          productCategories: {
            include: {
              category: true
            },
            orderBy: { isPrimary: 'desc' }
          },
          images: {
            orderBy: { sortOrder: 'asc' }
          }
        }
      })
    })

    console.log('✅ Product updated successfully')

    // Transform product to include categories array
    const transformedProduct = {
      ...updatedProduct,
      categories: updatedProduct?.productCategories.map(pc => pc.category) || [],
      primaryCategory: updatedProduct?.productCategories.find(pc => pc.isPrimary)?.category,
      categoryIds: updatedProduct?.productCategories.map(pc => pc.categoryId) || []
    }

    return NextResponse.json(transformedProduct)
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/products/[id] - Delete single product (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check admin role (only admins can delete products directly)
  const authResult = await requireAdminRole(request)
  if (authResult instanceof NextResponse) {
    return authResult // Return error response
  }

  try {
    const { id } = await params

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Delete the product (images will be deleted automatically due to cascade)
    await prisma.product.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}