import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'

// GET /api/admin/products - List all products with pagination and filters
export async function GET(request: NextRequest) {
  // Check staff access (both admin and staff can view products)
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) {
    return authResult // Return error response
  }

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const status = searchParams.get('status') || ''

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } }
      ]
    }

    if (category) {
      where.productCategories = {
        some: {
          categoryId: category
        }
      }
    }

    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }

    // Get products with relations
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
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
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.product.count({ where })
    ])

    // Transform products to include categories array
    const transformedProducts = products.map(product => ({
      ...product,
      categories: product.productCategories.map(pc => pc.category),
      primaryCategory: product.productCategories.find(pc => pc.isPrimary)?.category || product.productCategories[0]?.category,
      // Keep backward compatibility
      category: product.productCategories.find(pc => pc.isPrimary)?.category || product.productCategories[0]?.category
    }))

    return NextResponse.json({
      products: transformedProducts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// POST /api/admin/products - Create new product
export async function POST(request: NextRequest) {
  // Check staff access (both admin and staff can create products)
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) {
    return authResult // Return error response
  }

  try {
    const data = await request.json()
    console.log('🔥 API POST - Received data:', data)

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
      mainCategoryId, // Main category ID (required)
      subCategoryId,  // Sub category ID (required)
      isActive,
      isFeatured,
      images,
      hasColorVariants,
      colorVariants
    } = data

    console.log('🖼️ API POST - Images received:', images)
    console.log('📊 API POST - Images count:', images?.length || 0)
    console.log('🎨 API POST - Has color variants:', hasColorVariants)
    console.log('🎨 API POST - Color variants:', colorVariants)
    console.log('🏷️ API POST - Main Category ID:', mainCategoryId)
    console.log('🏷️ API POST - Sub Category ID:', subCategoryId)

    // Validate that both main and sub categories are provided
    if (!mainCategoryId || !subCategoryId) {
      return NextResponse.json(
        { error: 'Both main category and sub-category must be selected' },
        { status: 400 }
      )
    }

    // Validate that the sub-category belongs to the main category
    const subCategory = await prisma.category.findUnique({
      where: { id: subCategoryId },
      include: { parent: true }
    })

    if (!subCategory || subCategory.parentId !== mainCategoryId) {
      return NextResponse.json(
        { error: 'Invalid category hierarchy: sub-category must belong to the selected main category' },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const existingProduct = await prisma.product.findUnique({
      where: { slug }
    })

    if (existingProduct) {
      console.log('❌ API POST - Slug already exists:', slug)
      return NextResponse.json(
        { error: 'Product with this slug already exists' },
        { status: 400 }
      )
    }

    // Check if SKU already exists (if provided)
    if (sku) {
      const existingProductBySku = await prisma.product.findUnique({
        where: { sku }
      })

      if (existingProductBySku) {
        console.log('❌ API POST - SKU already exists:', sku)
        return NextResponse.json(
          { error: 'Product with this SKU already exists' },
          { status: 400 }
        )
      }
    }

    // Prepare images for creation
    let imagesToCreate = []

    if (hasColorVariants && colorVariants && colorVariants.length > 0) {
      // Use color variant images
      console.log('🎨 Using color variant images')
      colorVariants.forEach((variant: any) => {
        if (variant.images && variant.images.length > 0) {
          variant.images.forEach((img: any, index: number) => {
            imagesToCreate.push({
              imageUrl: img.imageUrl,
              altText: img.altText || `${variant.colorName} - View ${index + 1}`,
              isPrimary: imagesToCreate.length === 0, // First image overall is primary
              sortOrder: imagesToCreate.length
            })
          })
        }
      })
    } else {
      // Use regular images
      console.log('🖼️ Using regular images')
      imagesToCreate = images?.map((img: any, index: number) => ({
        imageUrl: img.imageUrl,
        altText: img.altText || '',
        isPrimary: img.isPrimary || index === 0,
        sortOrder: img.sortOrder || index
      })) || []
    }

    console.log('🖼️ API POST - Images to create:', imagesToCreate)

    // Create product with categories and images
    const product = await prisma.product.create({
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
        isFeatured,
        productCategories: {
          create: [
            {
              categoryId: mainCategoryId,
              isPrimary: true
            },
            {
              categoryId: subCategoryId,
              isPrimary: false
            }
          ]
        },
        images: {
          create: imagesToCreate
        }
      },
      include: {
        productCategories: {
          include: {
            category: true
          }
        },
        images: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    // Create color variants if they exist
    if (hasColorVariants && colorVariants && colorVariants.length > 0) {
      console.log('🎨 Creating color variants...')
      for (let i = 0; i < colorVariants.length; i++) {
        const variant = colorVariants[i]
        if (variant.colorName && variant.colorCode) {
          await prisma.productVariant.create({
            data: {
              productId: product.id,
              name: 'Color',
              value: variant.colorName,
              colorCode: variant.colorCode,
              colorImage: variant.images?.[0]?.imageUrl || null,
              stock: parseInt(variant.stock || '0'),
              sku: variant.sku || null,
              price: variant.price ? parseFloat(variant.price) : null,
              sortOrder: i,
              isActive: true
            }
          })
          console.log(`✅ Created color variant: ${variant.colorName}`)
        }
      }
    }

    console.log('✅ API POST - Product created:', product.id)
    console.log('🖼️ API POST - Created images:', product.images)
    console.log('🏷️ API POST - Created categories:', product.productCategories)

    // Transform response to include categories array
    const transformedProduct = {
      ...product,
      categories: product.productCategories.map(pc => pc.category),
      primaryCategory: product.productCategories.find(pc => pc.isPrimary)?.category
    }

    return NextResponse.json(transformedProduct, { status: 201 })
  } catch (error) {
    console.error('💥 API POST Error:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/products - Update existing product
export async function PUT(request: NextRequest) {
  // Check staff access (both admin and staff can update products)
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
      shortDescription,
      price,
      compareAtPrice,
      stockQuantity,
      lowStockThreshold,
      sku,
      weight,
      categoryIds, // Array of category IDs
      isActive,
      isFeatured,
      images,
      hasColorVariants,
      colorVariants
    } = data

    console.log('🔄 API PUT - Updating product:', id)
    console.log('🏷️ API PUT - Category IDs:', categoryIds)

    // Validate that at least one category is provided
    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one category must be selected' },
        { status: 400 }
      )
    }

    // Check if slug already exists for different product
    const existingProduct = await prisma.product.findFirst({
      where: {
        slug,
        NOT: { id }
      }
    })

    if (existingProduct) {
      return NextResponse.json(
        { error: 'Product with this slug already exists' },
        { status: 400 }
      )
    }

    // Check if SKU already exists for different product (if provided)
    if (sku) {
      const existingProductBySku = await prisma.product.findFirst({
        where: {
          sku,
          NOT: { id }
        }
      })

      if (existingProductBySku) {
        return NextResponse.json(
          { error: 'Product with this SKU already exists' },
          { status: 400 }
        )
      }
    }

    // Update product and replace categories and images
    const product = await prisma.product.update({
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
        isFeatured,
        productCategories: {
          deleteMany: {}, // Delete existing category relationships
          create: categoryIds.map((categoryId: string, index: number) => ({
            categoryId,
            isPrimary: index === 0 // First category is primary
          }))
        },
        images: {
          deleteMany: {}, // Delete existing images
          create: (() => {
            let imagesToCreate = []

            if (hasColorVariants && colorVariants && colorVariants.length > 0) {
              // Use color variant images
              console.log('🎨 Using color variant images for update')
              colorVariants.forEach((variant: any) => {
                if (variant.images && variant.images.length > 0) {
                  variant.images.forEach((img: any, index: number) => {
                    imagesToCreate.push({
                      imageUrl: img.imageUrl,
                      altText: img.altText || `${variant.colorName} - View ${index + 1}`,
                      isPrimary: imagesToCreate.length === 0, // First image overall is primary
                      sortOrder: imagesToCreate.length
                    })
                  })
                }
              })
            } else {
              // Use regular images
              console.log('🖼️ Using regular images for update')
              imagesToCreate = images?.map((img: any, index: number) => ({
                imageUrl: img.imageUrl,
                altText: img.altText || '',
                isPrimary: img.isPrimary || index === 0,
                sortOrder: img.sortOrder || index
              })) || []
            }

            console.log('📸 Images to create:', imagesToCreate)
            return imagesToCreate
          })()
        }
      },
      include: {
        productCategories: {
          include: {
            category: true
          }
        },
        images: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    // Handle color variants with proper image storage
    if (hasColorVariants && colorVariants && colorVariants.length > 0) {
      console.log('🎨 Creating color variants with images...')

      // Delete existing color variants and their images
      await prisma.productVariant.deleteMany({
        where: {
          productId: id,
          name: 'Color'
        }
      })

      // Create new color variants with their images
      for (let i = 0; i < colorVariants.length; i++) {
        const variant = colorVariants[i]
        if (variant.colorName && variant.colorCode) {
          // Create the variant first
          const createdVariant = await prisma.productVariant.create({
            data: {
              productId: id,
              name: 'Color',
              value: variant.colorName,
              colorCode: variant.colorCode,
              colorImage: variant.images?.[0]?.imageUrl || null, // Keep for backward compatibility
              stock: parseInt(variant.stock || '0'),
              sku: variant.sku || null,
              price: variant.price ? parseFloat(variant.price) : null,
              sortOrder: i,
              isActive: true
            }
          })

          // Create images for this variant
          if (variant.images && variant.images.length > 0) {
            const variantImages = variant.images.map((img: any, imgIndex: number) => ({
              variantId: createdVariant.id,
              imageUrl: img.imageUrl,
              altText: img.altText || `${variant.colorName} - View ${imgIndex + 1}`,
              sortOrder: imgIndex
            }))

            await prisma.productVariantImage.createMany({
              data: variantImages
            })

            console.log(`✅ Created variant ${variant.colorName} with ${variant.images.length} images`)
          }
        }
      }
    } else {
      // If no color variants, delete any existing ones
      await prisma.productVariant.deleteMany({
        where: {
          productId: id,
          name: 'Color'
        }
      })
      console.log('🗑️ Removed all color variants (hasColorVariants is false)')
    }

    // Transform response to include categories array
    const transformedProduct = {
      ...product,
      categories: product.productCategories.map(pc => pc.category),
      primaryCategory: product.productCategories.find(pc => pc.isPrimary)?.category
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