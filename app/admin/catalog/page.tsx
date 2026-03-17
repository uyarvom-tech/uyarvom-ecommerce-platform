import { prisma } from "@/lib/prisma"
import { AdminHeader } from "@/components/admin-header"
import { CatalogView } from "@/components/admin/catalog-view"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function CatalogPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/admin/catalog")
  }

  const admin = await prisma.adminUser.findUnique({ where: { userId: user.id } })
  if (!admin) redirect("/")

  const categories = await prisma.category.findMany({
    where: {
      parentId: null
    },
    include: {
      _count: {
        select: {
          productCategories: true,
          children: true
        }
      }
    },
    orderBy: { displayOrder: 'asc' }
  })

  const transformedCategories = categories.map((c: any) => ({
    ...c,
    productCount: c._count.productCategories,
    subCategoryCount: c._count.children
  }))

  return (
    <div className="flex min-h-screen flex-col bg-muted/10">
      <AdminHeader />
      <main className="flex-1 px-8 py-10">
        <div className="container mx-auto max-w-7xl">
          <CatalogView categories={transformedCategories} userRole={admin.role} />
        </div>
      </main>
    </div>
  )
}
