import { prisma } from "@/lib/prisma"
import { AdminHeader } from "@/components/admin-header"
import { SubCategoryProductsView } from "@/components/admin/subcategory-products-view"
import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function SubCategoryProductsPage({
  params,
}: {
  params: Promise<{ categoryId: string; subCategoryId: string }>
}) {
  const { categoryId, subCategoryId } = await params
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

  const subCategory = await prisma.category.findUnique({
    where: {
      id: subCategoryId,
      parentId: categoryId
    }
  })

  if (!subCategory) notFound()

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      productCategories: {
        some: {
          categoryId: {
            in: [subCategoryId, categoryId],
          },
        },
      },
    },
    include: {
      productCategories: {
        include: {
          category: true,
        },
        orderBy: { isPrimary: 'desc' },
      },
      images: {
        where: { isPrimary: true },
        take: 1,
      },
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  const transformedProducts = products.map((product: any) => ({
    ...product,
    primaryImage: product.images[0]?.imageUrl
  }))

  return (
    <div className="flex min-h-screen flex-col bg-muted/10">
      <AdminHeader />
      <main className="flex-1 px-8 py-10">
        <div className="container mx-auto max-w-7xl">
          <SubCategoryProductsView
            mainCategory={mainCategory}
            subCategory={subCategory}
            products={transformedProducts}
            userRole={admin.role}
          />
        </div>
      </main>
    </div>
  )
}
