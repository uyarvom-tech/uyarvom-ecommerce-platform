import { prisma } from "@/lib/prisma"
import { AdminHeader } from "@/components/admin-header"
import { CatalogView } from "@/components/admin/catalog-view"
import { getCurrentUserRole } from "@/lib/auth-middleware"

export default async function CatalogPage() {
  // Get current user role
  const userRole = await getCurrentUserRole()

  // Fetch main categories with product and sub-category counts
  const categories = await prisma.category.findMany({
    where: { 
      isActive: true,
      parentId: null // Only main categories
    },
    include: {
      _count: {
        select: {
          productCategories: true,
          children: true
        }
      }
    },
    orderBy: [
      { displayOrder: 'asc' },
      { name: 'asc' }
    ]
  })

  // Transform categories to include counts
  const categoriesWithCount = categories.map(category => ({
    ...category,
    productCount: category._count.productCategories,
    subCategoryCount: category._count.children
  }))

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <AdminHeader />
      
      <main className="flex-1 px-6 py-8">
        <div className="container mx-auto max-w-6xl">
          <CatalogView categories={categoriesWithCount} userRole={userRole || 'staff'} />
        </div>
      </main>
    </div>
  )
}