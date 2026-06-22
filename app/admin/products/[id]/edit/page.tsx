import { prisma } from "@/lib/prisma-safe"
import { AdminHeader } from "@/components/admin-header"
import { ProductEditPageClient } from "@/components/admin/product-edit-page-client"
import { notFound } from "next/navigation"
import { redirect } from 'next/navigation'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface EditProductPageProps {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params

  // Fetch the product with its images, categories, and variants with their images
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: {
        orderBy: { sortOrder: 'asc' }
      },
      productCategories: {
        include: { category: true },
        orderBy: { isPrimary: 'desc' }
      },
      colors: {
        orderBy: { sortOrder: 'asc' },
        include: {
          images: {
            orderBy: { sortOrder: 'asc' }
          },
          variants: {
            orderBy: { sortOrder: 'asc' }
          }
        }
      }
    }
  })

  if (!product) {
    notFound()
  }

  const selectedCategories = product.productCategories.map((pc: any) => pc.category)
  const selectedMainCategory =
    selectedCategories.find((category: any) => category.parentId === null) ||
    selectedCategories.find((category: any) => !category.parentId)
  const selectedSubCategory =
    selectedCategories.find((category: any) => category.parentId === selectedMainCategory?.id) ||
    selectedCategories.find((category: any) => category.parentId)

  // Transform product to include categoryIds and color variants for form compatibility
  const productWithCategoryIds = {
    ...product,
    categoryIds: product.productCategories.map((pc: any) => pc.categoryId),
    categories: selectedCategories,
    primaryCategory: product.productCategories.find((pc: any) => pc.isPrimary)?.category,
    mainCategoryId: selectedMainCategory?.id || '',
    subCategoryId: selectedSubCategory?.id || '',
    colors: (product.colors || []).map((color: any) => ({
      id: color.id,
      colorName: color.colorName,
      colorCode: color.colorCode || '#000000',
      images: color.images.map((img: any, imgIndex: number) => ({
        id: img.id,
        imageUrl: img.imageUrl,
        altText: img.altText || `${color.colorName} - View ${imgIndex + 1}`,
        sortOrder: img.sortOrder
      })),
      sizes: color.variants.map((variant: any) => ({
        id: variant.id,
        size: variant.size,
        price: variant.price?.toString() || '',
        stock: variant.stock.toString(),
        sku: variant.sku || '',
        isActive: variant.isActive,
        sortOrder: variant.sortOrder
      }))
    }))
  }

  // Fetch all categories for the form
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: [
      { displayOrder: 'asc' },
      { name: 'asc' }
    ]
  })

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AdminHeader />
      <ProductEditPageClient 
        productId={id}
        product={productWithCategoryIds}
        categories={categories}
        existingImageCount={product.images.length}
      />
    </div>
  )
}
