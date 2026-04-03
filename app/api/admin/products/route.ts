import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'

type IncomingColor = {
  id?: string
  colorName?: string
  colorCode?: string | null
  images?: Array<{
    imageUrl: string
    altText?: string
    sortOrder?: number
  }>
  sizes?: Array<{
    size: string
    price?: string | number | null
    stock?: string | number | null
    sku?: string | null
    isActive?: boolean
    sortOrder?: number
  }>
}

function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeColors(input: any): IncomingColor[] {
  if (Array.isArray(input?.colors) && input.colors.length > 0) {
    return input.colors
  }

  if (Array.isArray(input?.colorVariants) && input.colorVariants.length > 0) {
    return input.colorVariants.map((variant: any) => ({
      colorName: variant.colorName,
      colorCode: variant.colorCode,
      images: variant.images || [],
      sizes: [
        {
          size: 'Default',
          price: variant.price ?? null,
          stock: variant.stock ?? 1,
          sku: variant.sku ?? null,
          isActive: true,
          sortOrder: 0,
        },
      ],
    }))
  }

  if (Array.isArray(input?.images) && input.images.length > 0) {
    return [
      {
        colorName: 'Default',
        colorCode: null,
        images: input.images,
        sizes: [
          {
            size: 'Default',
            price: null,
            stock: 1,
            sku: input.sku ?? null,
            isActive: true,
            sortOrder: 0,
          },
        ],
      },
    ]
  }

  return []
}

async function replaceProductStructure(tx: any, productId: string, colors: IncomingColor[]) {
  await tx.productImage.deleteMany({ where: { productId } })
  await tx.productVariant.deleteMany({ where: { productId } })
  await tx.productColor.deleteMany({ where: { productId } })

  for (let colorIndex = 0; colorIndex < colors.length; colorIndex++) {
    const color = colors[colorIndex]
    if (!color?.colorName?.trim()) continue

    const createdColor = await tx.productColor.create({
      data: {
        productId,
        colorName: color.colorName.trim(),
        colorCode: color.colorCode || null,
        sortOrder: colorIndex,
      },
    })

    const colorImages = (color.images || []).filter((image) => image?.imageUrl)
    if (colorImages.length > 0) {
      await tx.productImage.createMany({
        data: colorImages.map((image, imageIndex) => ({
          productId,
          colorId: createdColor.id,
          imageUrl: image.imageUrl,
          altText: image.altText || `${color.colorName} - View ${imageIndex + 1}`,
          isPrimary: colorIndex === 0 && imageIndex === 0,
          sortOrder: image.sortOrder ?? imageIndex,
        })),
      })
    }

    const sizes = Array.isArray(color.sizes) ? color.sizes : []
    if (sizes.length > 0) {
      await tx.productVariant.createMany({
          data: sizes
          .filter((size) => size?.size?.trim())
          .map((size, sizeIndex) => ({
            productId,
            colorId: createdColor.id,
            size: size.size.trim(),
            price: parseNumber(size.price),
            stock: Math.max(Number(size.stock ?? 1), 1),
            sku: size.sku || null,
            isActive: size.isActive ?? true,
            sortOrder: size.sortOrder ?? sizeIndex,
            name: 'Size',
            value: size.size.trim(),
          })),
      })
    }
  }
}

// GET /api/admin/products - List all products with pagination and filters
export async function GET(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const status = searchParams.get('status') || ''

    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
      ]
    }

    if (category) {
      where.productCategories = {
        some: {
          categoryId: category,
        },
      }
    }

    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          productCategories: {
            include: {
              category: true,
            },
            orderBy: { isPrimary: 'desc' },
          },
          images: {
            orderBy: { sortOrder: 'asc' },
          },
          colors: {
            orderBy: { sortOrder: 'asc' },
            include: {
              images: {
                orderBy: { sortOrder: 'asc' },
              },
              variants: {
                orderBy: { sortOrder: 'asc' },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])

    const transformedProducts = products.map((product) => ({
      ...product,
      categories: product.productCategories.map((pc) => pc.category),
      primaryCategory: product.productCategories.find((pc) => pc.isPrimary)?.category || product.productCategories[0]?.category,
      category: product.productCategories.find((pc) => pc.isPrimary)?.category || product.productCategories[0]?.category,
    }))

    return NextResponse.json({
      products: transformedProducts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
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
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const data = await request.json()
    const colors = normalizeColors(data)

    const {
      name,
      slug,
      description,
      shortDescription,
      price,
      compareAtPrice,
      lowStockThreshold,
      sku,
      weight,
      mainCategoryId,
      subCategoryId,
      isActive,
      isFeatured,
    } = data

    if (!mainCategoryId || !subCategoryId) {
      return NextResponse.json(
        { error: 'Both main category and sub-category must be selected' },
        { status: 400 }
      )
    }

    const subCategory = await prisma.category.findUnique({
      where: { id: subCategoryId },
      include: { parent: true },
    })

    if (!subCategory || subCategory.parentId !== mainCategoryId) {
      return NextResponse.json(
        { error: 'Invalid category hierarchy: sub-category must belong to the selected main category' },
        { status: 400 }
      )
    }

    const existingProduct = await prisma.product.findUnique({ where: { slug } })
    if (existingProduct) {
      return NextResponse.json(
        { error: 'Product with this slug already exists' },
        { status: 400 }
      )
    }

    if (sku) {
      const existingProductBySku = await prisma.product.findUnique({ where: { sku } })
      if (existingProductBySku) {
        return NextResponse.json(
          { error: 'Product with this SKU already exists' },
          { status: 400 }
        )
      }
    }

    if (!colors.length) {
      return NextResponse.json(
        { error: 'At least one product option is required' },
        { status: 400 }
      )
    }

    const product = await prisma.$transaction(async (tx) => {
      const createdProduct = await tx.product.create({
        data: {
          name,
          slug,
          description,
          shortDescription,
          price,
          compareAtPrice,
          stockQuantity: 1,
          lowStockThreshold,
          sku,
          weight,
          isActive,
          isFeatured,
          productCategories: {
            create: [
              { categoryId: mainCategoryId, isPrimary: true },
              { categoryId: subCategoryId, isPrimary: false },
            ],
          },
        },
        include: {
          productCategories: {
            include: { category: true },
          },
        },
      })

      await replaceProductStructure(tx, createdProduct.id, colors)

      const stockAggregate = await tx.productVariant.aggregate({
        where: { productId: createdProduct.id },
        _sum: { stock: true },
      })

      await tx.product.update({
        where: { id: createdProduct.id },
        data: {
          stockQuantity: stockAggregate._sum.stock ?? 1,
        },
      })

      return tx.product.findUnique({
        where: { id: createdProduct.id },
        include: {
          productCategories: {
            include: { category: true },
          },
          images: {
            orderBy: { sortOrder: 'asc' },
          },
          colors: {
            orderBy: { sortOrder: 'asc' },
            include: {
              images: { orderBy: { sortOrder: 'asc' } },
              variants: { orderBy: { sortOrder: 'asc' } },
            },
          },
        },
      })
    })

    if (!product) {
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
    }

    const transformedProduct = {
      ...product,
      categories: product.productCategories.map((pc) => pc.category),
      primaryCategory: product.productCategories.find((pc) => pc.isPrimary)?.category,
    }

    return NextResponse.json(transformedProduct, { status: 201 })
  } catch (error) {
    console.error('API POST Error:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/products - Update existing product
export async function PUT(request: NextRequest) {
  const authResult = await requireStaffAccess(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const data = await request.json()
    const colors = normalizeColors(data)

    const {
      id,
      name,
      slug,
      description,
      shortDescription,
      price,
      compareAtPrice,
      lowStockThreshold,
      sku,
      weight,
      categoryIds,
      isActive,
      isFeatured,
    } = data

    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one category must be selected' },
        { status: 400 }
      )
    }

    const existingProduct = await prisma.product.findFirst({
      where: {
        slug,
        NOT: { id },
      },
    })

    if (existingProduct) {
      return NextResponse.json(
        { error: 'Product with this slug already exists' },
        { status: 400 }
      )
    }

    if (sku) {
      const existingProductBySku = await prisma.product.findFirst({
        where: {
          sku,
          NOT: { id },
        },
      })

      if (existingProductBySku) {
        return NextResponse.json(
          { error: 'Product with this SKU already exists' },
          { status: 400 }
        )
      }
    }

    if (!colors.length) {
      return NextResponse.json(
        { error: 'At least one color with images and sizes is required' },
        { status: 400 }
      )
    }

    const updatedProduct = await prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id },
        data: {
          name,
          slug,
          description,
          shortDescription,
          price,
          compareAtPrice,
          stockQuantity: 0,
          lowStockThreshold,
          sku,
          weight,
          isActive,
          isFeatured,
        },
      })

      await tx.productCategory.deleteMany({ where: { productId: id } })
      await tx.productCategory.createMany({
        data: categoryIds.map((categoryId: string, index: number) => ({
          productId: id,
          categoryId,
          isPrimary: index === 0,
        })),
      })

      await replaceProductStructure(tx, id, colors)

      const stockAggregate = await tx.productVariant.aggregate({
        where: { productId: id },
        _sum: { stock: true },
      })

      await tx.product.update({
        where: { id },
        data: {
          stockQuantity: stockAggregate._sum.stock ?? 1,
        },
      })

      return tx.product.findUnique({
        where: { id },
        include: {
          productCategories: {
            include: { category: true },
            orderBy: { isPrimary: 'desc' },
          },
          images: {
            orderBy: { sortOrder: 'asc' },
          },
          colors: {
            orderBy: { sortOrder: 'asc' },
            include: {
              images: { orderBy: { sortOrder: 'asc' } },
              variants: { orderBy: { sortOrder: 'asc' } },
            },
          },
        },
      })
    })

    const transformedProduct = {
      ...updatedProduct,
      categories: updatedProduct?.productCategories.map((pc) => pc.category) || [],
      primaryCategory: updatedProduct?.productCategories.find((pc) => pc.isPrimary)?.category,
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
