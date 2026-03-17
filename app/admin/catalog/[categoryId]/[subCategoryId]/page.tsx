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

  const productCategories = await prisma.productCategory.findMany({
    where: {
      categoryId: subCategoryId,
    },
    include: {
      product: {
        include: {
          images: { where: { isPrimary: true }, take: 1 }
        }
      }
    },
    orderBy: {
      product: {
        createdAt: 'desc'
      }
    }
  })

  const products = productCategories
    .filter((pc: any) => pc.product)
    .map((pc: any) => ({
      ...pc.product,
      primaryImage: pc.product.images[0]?.imageUrl
    }))

  return (
    <div className="flex min-h-screen flex-col bg-muted/10">
      <AdminHeader />
      <main className="flex-1 px-8 py-10">
        <div className="container mx-auto max-w-7xl">
          <SubCategoryProductsView
            mainCategory={mainCategory}
            subCategory={subCategory}
            products={products}
            userRole={admin.role}
          />
        </div>
      </main>
    </div>
  )
}