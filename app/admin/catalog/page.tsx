import { prisma } from "@/lib/prisma-safe"
import { AdminHeader } from "@/components/admin-header"
import { CatalogView } from "@/components/admin/catalog-view"
import { getCurrentUserRole } from "@/lib/auth-middleware"

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CatalogPage() {
  try {
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
    const categoriesWithCount = categories.map((category: any) => ({
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
  } catch (error) {
    console.error('Error loading catalog page:', error)
    
    return (
      <div className="flex min-h-screen flex-col bg-muted/30">
        <AdminHeader />
        
        <main className="flex-1 px-6 py-8">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Catalog Management</h2>
              <p className="text-gray-600">Database connection not available. Please configure your database settings.</p>
            </div>
          </div>
        </main>
      </div>
    )
  }
}
