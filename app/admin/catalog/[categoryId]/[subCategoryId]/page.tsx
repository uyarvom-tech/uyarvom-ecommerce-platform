import { prisma } from "@/lib/prisma-safe"
import { AdminHeader } from "@/components/admin-header"
import { SubCategoryProductsView } from "@/components/admin/subcategory-products-view"
import { notFound } from "next/navigation"

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function SubCategoryProductsPage({
  params,
}: {
  params: Promise<{ categoryId: string; subCategoryId: string }>
}) {
  const { categoryId, subCategoryId } = await params

  // Get the main category
  const mainCategory = await prisma.category.findUnique({
    where: { 
      id: categoryId,
      parentId: null // Ensure it's a main category
    }
  })

  if (!mainCategory) {
    notFound()
  }

  // Get the sub-category
  const subCategory = await prisma.category.findUnique({
    where: { 
      id: subCategoryId,
      parentId: categoryId // Ensure it belongs to the main category
    }
  })

  if (!subCategory) {
    notFound()
  }

  // Get products in this sub-category
  const productCategories = await prisma.productCategory.findMany({
    where: { 
      categoryId: subCategoryId,
      product: {
        isActive: true
      }
    },
    include: {
      product: true
    },
    orderBy: {
      product: {
        name: 'asc'
      }
    }
  })

  // Transform products data
  const products = productCategories
    .filter((pc: any) => pc.product) // Ensure product exists
    .map((pc: any) => ({
      id: pc.product.id,
      name: pc.product.name,
      slug: pc.product.slug,
      sku: pc.product.sku || '',
      price: pc.product.price,
      stockQuantity: pc.product.stockQuantity,
      isActive: pc.product.isActive
    }))

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <AdminHeader />
      <main className="flex-1 px-6 py-8">
        <div className="container mx-auto max-w-6xl">
          <SubCategoryProductsView 
            mainCategory={mainCategory}
            subCategory={subCategory}
            products={products}
          />
        </div>
      </main>
    </div>
  )
}