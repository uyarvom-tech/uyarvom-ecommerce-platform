import { prisma } from "@/lib/prisma-safe"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AppleReveal } from "@/components/apple-scroll-animations"
import { AIKitchenMatch } from "@/components/ai-kitchen-match"
import { ProductsSearch } from "@/components/products-search"
import { STORE_ROOT_CATEGORY_NAMES } from "@/lib/store-catalog"
import { StorefrontGrid } from "@/components/storefront-grid"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sub?: string; sort?: string; min?: string; max?: string; tab?: string; search?: string }>
}) {
  const params = await searchParams
  const isAITab = params.tab === "ai-match"
  const searchQuery = params.search
  const where: any = { isActive: true }

  if (searchQuery && !isAITab) {
    where.OR = [
      { name: { contains: searchQuery } },
      { description: { contains: searchQuery } },
      { shortDescription: { contains: searchQuery } },
      { sku: { contains: searchQuery } },
      {
        productCategories: {
          some: {
            category: {
              name: { contains: searchQuery },
            },
          },
        },
      },
    ]
  }

  if (params.sub && !isAITab) {
    const subCategory = await prisma.category.findUnique({ where: { slug: params.sub } })
    if (subCategory) {
      where.productCategories = { some: { categoryId: subCategory.id } }
    }
  } else if (params.category && !isAITab) {
    const category = await prisma.category.findUnique({
      where: { slug: params.category },
      include: { children: { select: { id: true } } },
    })

    if (category) {
      where.productCategories = {
        some: {
          categoryId: { in: [category.id, ...category.children.map((child) => child.id)] },
        },
      }
    }
  }

  if (params.min && !isAITab) where.price = { ...where.price, gte: Number.parseFloat(params.min) }
  if (params.max && !isAITab) where.price = { ...where.price, lte: Number.parseFloat(params.max) }

  let orderBy: any = { createdAt: "desc" }
  if (!isAITab) {
    switch (params.sort || "newest") {
      case "price-asc":
        orderBy = { price: "asc" }
        break
      case "price-desc":
        orderBy = { price: "desc" }
        break
      case "name":
        orderBy = { name: "asc" }
        break
      default:
        orderBy = { createdAt: "desc" }
    }
  }

  const [products, categories] = await Promise.all([
    !isAITab
      ? prisma.product.findMany({
          where,
          include: {
            productCategories: {
              include: { category: true },
              orderBy: { isPrimary: "desc" },
            },
            images: {
              orderBy: { sortOrder: "asc" },
            },
            colors: {
              orderBy: { sortOrder: "asc" },
              include: {
                images: {
                  orderBy: { sortOrder: "asc" },
                },
                variants: {
                  where: { isActive: true },
                  orderBy: { sortOrder: "asc" },
                },
              },
            },
            variants: {
              where: { isActive: true },
              orderBy: { sortOrder: "asc" },
            },
          },
          orderBy,
        })
      : [],
    prisma.category.findMany({
      where: {
        isActive: true,
        parentId: null,
        name: { in: [...STORE_ROOT_CATEGORY_NAMES] },
      },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { name: "asc" },
        },
      },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    }),
  ])

  const aiProducts = isAITab
    ? await prisma.product.findMany({
        where: { isActive: true },
        include: {
          productCategories: {
            include: { category: true },
            orderBy: { isPrimary: "desc" },
          },
          images: {
            orderBy: { sortOrder: "asc" },
          },
          colors: {
            orderBy: { sortOrder: "asc" },
            include: {
              images: {
                orderBy: { sortOrder: "asc" },
              },
              variants: {
                where: { isActive: true },
                orderBy: { sortOrder: "asc" },
              },
            },
          },
          variants: {
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
          },
        },
      })
    : []

  const displayProducts = isAITab ? aiProducts : products

  return (
    <div className="flex min-h-screen flex-col bg-background apple-scroll-snap">
      <Header />

      <main className="flex-1">
        {!isAITab && (
          <section className="py-4 border-b border-border/50">
            <div className="w-full px-2 sm:px-4 xl:px-6">
              <AppleReveal>
                <div className="mb-6">
                  <ProductsSearch />
                </div>

                {(params.category || params.sub) && (
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">
                      Showing: <span className="font-medium text-primary capitalize">{params.sub || params.category}</span>
                    </div>
                  </div>
                )}
              </AppleReveal>
            </div>
          </section>
        )}

        <section className="py-8">
          {isAITab ? (
            <div className="w-full px-2 sm:px-3 lg:px-0">
              <AppleReveal>
                <AIKitchenMatch products={displayProducts || []} />
              </AppleReveal>
            </div>
          ) : (
            <StorefrontGrid
              categories={categories.map((category) => ({
                id: category.id,
                name: category.name,
                slug: category.slug,
                children: category.children.map((child) => ({
                  id: child.id,
                  name: child.name,
                  slug: child.slug,
                })),
              }))}
              products={displayProducts || []}
              basePath="/products"
              searchQuery={searchQuery}
              scrollTargetId="store-grid"
              emptyTitle={searchQuery ? `No products found for "${searchQuery}"` : "No products found"}
              emptyDescription="Try adjusting your filters, category, or search terms."
              emptyButtonLabel="View all products"
            />
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}
