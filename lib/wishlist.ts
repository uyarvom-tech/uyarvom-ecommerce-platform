import { prisma } from "@/lib/prisma"
import type { FlexibleProduct, ProductImage } from "@/types"
import { getVariantStockTotal } from "@/lib/variant-stock"

export interface WishlistEntry {
  id: string
  userId: string
  productId: string
  createdAt: Date
  product: FlexibleProduct
}

function mapProduct(product: any): FlexibleProduct {
  const images: ProductImage[] = (product.images ?? []).map((image: any) => ({
    id: image.id,
    imageUrl: image.imageUrl,
    altText: image.altText,
    displayOrder: image.sortOrder,
  }))

  const mappedProduct = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    short_description: product.shortDescription,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    sku: product.sku ?? undefined,
    isActive: product.isActive,
    images,
    stockQuantity: getVariantStockTotal(product),
    lowStockThreshold: product.lowStockThreshold,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    colors: (product.colors ?? []).map((color: any) => ({
      id: color.id,
      colorName: color.colorName,
      colorCode: color.colorCode,
      images: (color.images ?? []).map((image: any) => ({
        id: image.id,
        imageUrl: image.imageUrl,
        altText: image.altText,
        sortOrder: image.sortOrder,
      })),
      variants: (color.variants ?? []).map((variant: any) => ({
        id: variant.id,
        size: variant.size,
        price: variant.price,
        stock: variant.stock,
        isActive: variant.isActive,
        sku: variant.sku,
        sortOrder: variant.sortOrder,
      })),
    })),
    productCategories: (product.productCategories ?? []).map((item: any) => ({
      category: {
        name: item.category.name,
        slug: item.category.slug,
      },
    })),
  } as any

  return mappedProduct as FlexibleProduct
}

export async function getWishlistItemsForUser(userId: string): Promise<WishlistEntry[]> {
  const wishlistItems = await prisma.wishlistItem.findMany({
    where: { userId },
    include: {
          product: {
            include: {
              images: {
                orderBy: { sortOrder: "asc" },
              },
              productCategories: {
                include: {
                  category: true,
                },
                orderBy: { isPrimary: "desc" },
              },
              colors: {
                orderBy: { sortOrder: "asc" },
                include: {
                  images: { orderBy: { sortOrder: "asc" } },
                  variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
                },
              },
            },
          },
    },
    orderBy: { createdAt: "desc" },
  })

  return wishlistItems.map((item) => ({
    id: item.id,
    userId: item.userId,
    productId: item.productId,
    createdAt: item.createdAt,
    product: mapProduct(item.product),
  }))
}

export async function getWishlistItemForUser(userId: string, productId: string) {
  return prisma.wishlistItem.findFirst({
    where: {
      userId,
      productId,
    },
    select: {
      id: true,
      userId: true,
      productId: true,
      createdAt: true,
    },
  })
}

export async function addWishlistItem(userId: string, productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  })

  if (!product) {
    return null
  }

  return prisma.wishlistItem.upsert({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
    create: {
      userId,
      productId,
    },
    update: {},
    select: {
      id: true,
      userId: true,
      productId: true,
      createdAt: true,
    },
  })
}

export async function removeWishlistItem(userId: string, productId: string) {
  return prisma.wishlistItem.deleteMany({
    where: {
      userId,
      productId,
    },
  })
}
