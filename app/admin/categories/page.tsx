import { prisma } from "@/lib/prisma"
import { AdminHeader } from "@/components/admin-header"
import { CategoryManagement } from "@/components/admin/category-management"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function CategoriesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/admin/categories")
  }

  const admin = await prisma.adminUser.findUnique({ where: { userId: user.id } })
  if (!admin) {
    redirect("/admin")
  }

  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: {
          productCategories: true,
          children: true,
        },
      },
    },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  })

  const transformedCategories = categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    imageUrl: category.imageUrl,
    displayOrder: category.displayOrder,
    parentId: category.parentId,
    createdAt: category.createdAt.toISOString(),
    productCount: category._count.productCategories,
    subCategoryCount: category._count.children,
  }))

  return (
    <div className="flex min-h-screen flex-col bg-muted/10">
      <AdminHeader />
      <main className="flex-1 px-8 py-10">
        <div className="container mx-auto max-w-7xl">
          <CategoryManagement categories={transformedCategories} />
        </div>
      </main>
    </div>
  )
}
