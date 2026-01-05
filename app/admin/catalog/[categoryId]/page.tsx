import { prisma } from "@/lib/prisma"
import { AdminHeader } from "@/components/admin-header"
import { CategoryProductsView } from "@/components/admin/category-products-view"
import { getCurrentUserRole } from "@/lib/auth-middleware"
import { notFound } from "next/navigation"

interface CategoryDetailPageProps {
  params: Promise<{ categoryId: string }>
}

export default async function CategoryDetailPage({ params }: CategoryDetailPageProps) {
  const { categoryId } = await params

  // Get current user role
  const userRole = await getCurrentUserRole()

  // Fetch category with products
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      productCategories: {
        include: {
          product: {
            include: {
              images: {
                orderBy: { sortOrder: 'asc' }
              },
              productCategories: {
                include: {
                  category: true
                },
                orderBy: { isPrimary: 'desc' }
              }
            }
          }
        }
      }
    }
  })

  if (!category) {
    notFound()
  }

  // Transform products data
  const products = category.productCategories.map(pc => ({
    ...pc.product,
    categories: pc.product.productCategories.map(pcat => ({
      id: pcat.category.id,
      name: pcat.category.name,
      isPrimary: pcat.isPrimary
    }))
  }))

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AdminHeader />
      
      <main className="flex-1 container mx-auto px-6 py-8 max-w-7xl">
        <CategoryProductsView 
          category={category}
          products={products}
          userRole={userRole || 'staff'}
        />
      </main>
    </div>
  )
}