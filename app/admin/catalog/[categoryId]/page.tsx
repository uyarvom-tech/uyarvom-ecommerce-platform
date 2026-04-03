import { prisma } from "@/lib/prisma"
import { AdminHeader } from "@/components/admin-header"
import { CategoryDetailView } from "@/components/admin/category-detail-view"
import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ categoryId: string }>
}) {
  const { categoryId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login?redirect=/admin/catalog")

  const admin = await prisma.adminUser.findUnique({ where: { userId: user.id } })
  if (!admin) redirect("/")

  const mainCategory = await prisma.category.findUnique({
    where: {
      id: categoryId,
      parentId: null
    }
  })

  if (!mainCategory) notFound()

  const subCategories = await prisma.category.findMany({
    where: {
      parentId: categoryId,
    },
    orderBy: { displayOrder: 'asc' }
  })

  const transformedSubCategories = await Promise.all(
    subCategories.map(async (sc) => {
      const productCount = await prisma.product.count({
        where: {
          isActive: true,
          productCategories: {
            some: {
              categoryId: {
                in: [sc.id, categoryId],
              },
            },
          },
        },
      })

      return {
        ...sc,
        productCount,
      }
    })
  )

  return (
    <div className="flex min-h-screen flex-col bg-muted/10">
      <AdminHeader />
      <main className="flex-1 px-8 py-10">
        <div className="container mx-auto max-w-7xl">
          <CategoryDetailView
            mainCategory={mainCategory}
            subCategories={transformedSubCategories}
            userRole={admin.role}
          />
        </div>
      </main>
    </div>
  )
}
