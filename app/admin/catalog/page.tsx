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
      children: {
        select: {
          id: true,
        },
      },
      _count: {
        select: {
          productCategories: true,
          children: true
        }
      }
    },
    orderBy: { displayOrder: 'asc' }
  })

  const categoryIds = categories.flatMap((category: any) => [
    category.id,
    ...(category.children || []).map((child: any) => child.id),
  ])

  const productCategoryLinks = categoryIds.length
    ? await prisma.productCategory.findMany({
      where: {
        categoryId: { in: categoryIds },
        product: { isActive: true },
      },
      select: {
        categoryId: true,
        productId: true,
      },
    })
    : []

  const productIdsByCategoryId = new Map<string, Set<string>>()
  for (const link of productCategoryLinks) {
    if (!productIdsByCategoryId.has(link.categoryId)) {
      productIdsByCategoryId.set(link.categoryId, new Set())
    }
    productIdsByCategoryId.get(link.categoryId)!.add(link.productId)
  }

  const transformedCategories = categories.map((category: any) => {
    const descendantIds = (category.children || []).map((child: any) => child.id)
    const productIds = new Set<string>()
    for (const categoryId of [category.id, ...descendantIds]) {
      for (const productId of productIdsByCategoryId.get(categoryId) || []) {
        productIds.add(productId)
      }
    }

    return {
      ...category,
      productCount: productIds.size,
      subCategoryCount: category._count.children,
    }
  })

  return (
    <div className="flex min-h-screen flex-col bg-muted/10">
      <AdminHeader userRole={admin.role} />
      <main className="flex-1 px-8 py-10">
        <div className="container mx-auto max-w-7xl">
          <CatalogView categories={transformedCategories} userRole={admin.role} />
        </div>
      </main>
    </div>
  )
}
