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
          categoryId: subCategoryId,
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
        orderBy: { sortOrder: 'asc' },
      },
      colors: {
        select: {
          id: true,
          variants: {
            select: {
              id: true,
              stock: true,
              isActive: true,
              sortOrder: true,
            },
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: { sortOrder: 'asc' },
      },
      variants: {
        select: {
          id: true,
          stock: true,
          isActive: true,
          sortOrder: true,
        },
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  console.log(`[DEBUG] SubCategory: ${subCategory.name} (${subCategoryId})`)
  console.log(`[DEBUG] Found ${products.length} products`)

  const transformedProducts = products.map((product: any) => ({
    ...product,
    primaryImage: product.images.find((img: any) => img.isPrimary)?.imageUrl ?? product.images[0]?.imageUrl
  }))

  return (
    <div className="flex min-h-screen flex-col bg-muted/10">
      <AdminHeader userRole={admin.role} />
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
