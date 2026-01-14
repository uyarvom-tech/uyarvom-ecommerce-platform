import { prisma } from "@/lib/prisma-safe"
import { AdminHeader } from "@/components/admin-header"
import { CategoryForm } from "@/components/admin/category-form"

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function NewCategoryPage() {
  // Get main categories for parent selection
  const mainCategories = await prisma.category.findMany({
    where: { 
      isActive: true,
      parentId: null // Only main categories
    },
    orderBy: [
      { displayOrder: 'asc' },
      { name: 'asc' }
    ]
  })

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <AdminHeader />
      <main className="flex-1 px-6 py-8">
        <div className="container mx-auto max-w-4xl">
          <CategoryForm mainCategories={mainCategories} />
        </div>
      </main>
    </div>
  )
}
