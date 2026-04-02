import { prisma } from "@/lib/prisma-safe"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/product-card"
import { ProductFilters } from "@/components/product-filters"
import { AppleReveal } from "@/components/apple-scroll-animations"
import { AIKitchenMatch } from "@/components/ai-kitchen-match"
import { ProductsSearch } from "@/components/products-search"
import { Search } from "lucide-react"
import { STORE_ROOT_CATEGORY_NAMES } from "@/lib/store-catalog"

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
            <div className="max-w-[980px] mx-auto px-6">
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
          <div className="max-w-[1200px] mx-auto px-6">
            {isAITab ? (
              <AppleReveal>
                <AIKitchenMatch products={displayProducts || []} />
              </AppleReveal>
            ) : (
              <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
                <aside className="hidden lg:block lg:col-span-1">
                  <AppleReveal delay={100}>
                    <div className="sticky top-20">
                      <ProductFilters
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
                        basePath="/products"
                      />
                    </div>
                  </AppleReveal>
                </aside>

                <div>
                  {searchQuery && (
                    <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                      <p className="text-sm text-primary">
                        Showing {displayProducts?.length || 0} results for "<strong>{searchQuery}</strong>"
                      </p>
                    </div>
                  )}

                  {displayProducts && displayProducts.length > 0 ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {displayProducts.map((product: any, index: number) => (
                        <AppleReveal key={product.id} delay={index * 100}>
                          <ProductCard product={product} />
                        </AppleReveal>
                      ))}
                    </div>
                  ) : (
                    <AppleReveal>
                      <div className="apple-card p-12 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                          <Search className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">
                          {searchQuery ? `No products found for "${searchQuery}"` : "No products found"}
                        </h3>
                        <p className="apple-body">
                          Try adjusting your filters, category, or search terms.
                        </p>
                      </div>
                    </AppleReveal>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
