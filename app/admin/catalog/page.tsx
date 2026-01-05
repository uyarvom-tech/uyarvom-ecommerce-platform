import { prisma } from "@/lib/prisma"
import { AdminHeader } from "@/components/admin-header"
import { CatalogView } from "@/components/admin/catalog-view"
import { getCurrentUserRole } from "@/lib/auth-middleware"

export default async function CatalogPage() {
  // Get current user role
  const userRole = await getCurrentUserRole()

  // Fetch all categories with product counts
  const categories = await prisma.category.findMany({
    where: { isActive: true },
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

  // Transform categories to include product count
  const categoriesWithCount = categories.map(category => ({
    ...category,
    productCount: category._count.productCategories
  }))

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AdminHeader />
      
      <main className="flex-1 container mx-auto px-6 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Catalog Management</h1>
          <p className="text-muted-foreground">
            Manage your product categories and inventory
          </p>
        </div>

        <CatalogView categories={categoriesWithCount} userRole={userRole || 'staff'} />
      </main>
    </div>
  )
}