import { prisma } from "@/lib/prisma-safe"
import { AdminHeader } from "@/components/admin-header"
import { CategoryForm } from "@/components/admin/category-form"
import { notFound, redirect } from "next/navigation"

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function NewSubCategoryPage({
  params,
}: {
  params: Promise<{ categoryId: string }>
}) {
  const { categoryId } = await params

  // Get the main category to ensure it exists and is a main category
  const mainCategory = await prisma.category.findUnique({
    where: { 
      id: categoryId,
      parentId: null // Ensure it's a main category
    }
  })

  if (!mainCategory) {
    notFound()
  }

  // Get all main categories for the form
  const mainCategories = await prisma.category.findMany({
    where: { 
      isActive: true,
      parentId: null
    },
    orderBy: [
      { displayOrder: 'asc' },
      { name: 'asc' }
    ]
  })

  // Redirect to the form with the parent category pre-selected
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <AdminHeader />
      <main className="flex-1 px-6 py-8">
        <div className="container mx-auto max-w-4xl">
          <CategoryForm 
            mainCategories={mainCategories}
            defaultParentId={categoryId}
          />
        </div>
      </main>
    </div>
  )
}