import { prisma } from "@/lib/prisma"
import { AdminHeader } from "@/components/admin-header"
import { ProductForm } from "@/components/admin/product-form"
import { notFound } from "next/navigation"

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
      variants: {
        where: { name: 'Color' },
        include: {
          images: {
            orderBy: { sortOrder: 'asc' }
          }
        },
        orderBy: { sortOrder: 'asc' }
      }
    }
  })

  if (!product) {
    notFound()
  }

  // Transform product to include categoryIds and color variants for form compatibility
  const productWithCategoryIds = {
    ...product,
    categoryIds: product.productCategories.map(pc => pc.categoryId),
    categories: product.productCategories.map(pc => pc.category),
    primaryCategory: product.productCategories.find(pc => pc.isPrimary)?.category,
    // Transform variants to color variants format with proper images
    hasColorVariants: product.variants.length > 0,
    colorVariants: product.variants.map((variant, index) => ({
      id: `existing-color-${variant.id}`,
      colorName: variant.value,
      colorCode: variant.colorCode || '#000000',
      images: variant.images.map((img, imgIndex) => ({
        id: `existing-img-${img.id}`,
        imageUrl: img.imageUrl,
        altText: img.altText || `${variant.value} - View ${imgIndex + 1}`,
        sortOrder: img.sortOrder
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
      
      <main className="flex-1 container mx-auto px-6 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
          <p className="text-muted-foreground">
            Update product information, images, and settings
          </p>
        </div>

        <ProductForm categories={categories} product={productWithCategoryIds} />
      </main>
    </div>
  )
}