import { prisma } from "@/lib/prisma"
import { AdminHeader } from "@/components/admin-header"
import { CategoryDetailView } from "@/components/admin/category-detail-view"
import { getCurrentUserRole } from "@/lib/auth-middleware"
import { notFound } from "next/navigation"

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ categoryId: string }>
}) {
  const { categoryId } = await params

  // Get current user role
  const userRole = await getCurrentUserRole()

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

  // Get sub-categories for this main category
  const subCategories = await prisma.category.findMany({
    where: { 
      parentId: categoryId,
      isActive: true 
    },
    include: {
      _count: {
        select: {
          productCategories: true
        }
      }
    },
    orderBy: [
      { displayOrder: 'asc' },
      { name: 'asc' }
    ]
  })

  // Transform sub-categories to include product count
  const subCategoriesWithCount = subCategories.map(subCategory => ({
    ...subCategory,
    productCount: subCategory._count.productCategories
  }))

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <AdminHeader />
      <main className="flex-1 px-6 py-8">
        <div className="container mx-auto max-w-6xl">
          <CategoryDetailView 
            mainCategory={mainCategory}
            subCategories={subCategoriesWithCount}
            userRole={userRole || 'staff'}
          />
        </div>
      </main>
    </div>
  )
}