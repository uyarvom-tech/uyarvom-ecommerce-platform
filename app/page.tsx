import Link from "next/link"
import { prisma } from "@/lib/prisma-safe"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/product-card"
import { ProductFilters } from "@/components/product-filters"
import { AIKitchenMatch } from "@/components/ai-kitchen-match"
import { CategoryNavigation } from "@/components/category-navigation"
import { SaleBanner } from "@/components/sale-banner"
import { HomeMainHero } from "@/components/home-main-hero"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { STORE_ROOT_CATEGORY_NAMES } from "@/lib/store-catalog"
import { ProductHorizontalScroll } from "@/components/product-horizontal-scroll"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string
    sub?: string
    sort?: string
    min?: string
    max?: string
    tab?: string
    search?: string
  }>
}) {
  const params = await searchParams
  const isAITab = params.tab === "ai-match"
  const searchQuery = params.search?.trim()

  const categories = await prisma.category.findMany({
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
      _count: {
        select: { productCategories: true },
      },
    },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  })

  const categoryBySlug = new Map(categories.map((category) => [category.slug, category]))
  const childCategoryBySlug = new Map(
    categories.flatMap((category) => category.children.map((child) => [child.slug, { child, parent: category }] as const))
  )

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

  if (!isAITab) {
    if (params.sub && childCategoryBySlug.has(params.sub)) {
      where.productCategories = {
        some: { categoryId: childCategoryBySlug.get(params.sub)!.child.id },
      }
    } else if (params.category && categoryBySlug.has(params.category)) {
      const category = categoryBySlug.get(params.category)!
      const categoryIds = [category.id, ...category.children.map((child) => child.id)]
      where.productCategories = {
        some: { categoryId: { in: categoryIds } },
      }
    }

    if (params.min) where.price = { ...where.price, gte: Number.parseFloat(params.min) }
    if (params.max) where.price = { ...where.price, lte: Number.parseFloat(params.max) }
  }

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

  const [products, aiProducts, banners, featuredProducts, newArrivals, saleProducts] = await Promise.all([
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
        },
        orderBy,
      })
      : [],
    isAITab
      ? prisma.product.findMany({
        where: { isActive: true },
        include: {
          productCategories: {
            include: { category: true },
            orderBy: { isPrimary: "desc" },
          },
          images: {
            orderBy: { sortOrder: "asc" },
          },
        },
      })
      : [],
    (prisma as any).heroBanner.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' }
    }),
    prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      take: 8,
      include: {
        productCategories: { include: { category: true } },
        images: { orderBy: { sortOrder: 'asc' } }
      }
    }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        productCategories: { include: { category: true } },
        images: { orderBy: { sortOrder: 'asc' } }
      }
    }),
    prisma.product.findMany({
      where: { isActive: true, compareAtPrice: { not: null } },
      take: 8,
      include: {
        productCategories: { include: { category: true } },
        images: { orderBy: { sortOrder: 'asc' } }
      }
    })
  ])

  const displayProducts = isAITab ? aiProducts : products
  const selectedCategoryName =
    (params.sub && childCategoryBySlug.get(params.sub)?.child.name) ||
    (params.category && categoryBySlug.get(params.category)?.name) ||
    ""

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <CategoryNavigation
        categories={categories.map((category) => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
          imageUrl: category.imageUrl,
          children: category.children.map((child) => ({
            id: child.id,
            name: child.name,
            slug: child.slug,
          })),
        }))}
      />

      <main className="flex-1">
        {!searchQuery && !params.category && !params.sub && !isAITab && (
          <>
            <HomeMainHero banners={banners} />
            <SaleBanner />
            <ProductHorizontalScroll
              title="Curated Collections"
              subtitle="Handpicked Architecture for your home"
              products={featuredProducts}
            />
            <ProductHorizontalScroll
              title="New Arrivals"
              subtitle="The latest additions to our repository"
              products={newArrivals}
            />
            <ProductHorizontalScroll
              title="Limited Offers"
              subtitle="Premium assets at curated valuations"
              products={saleProducts}
            />
          </>
        )}

        <section id="store-grid" className="py-6 md:py-8">
          <div className="mx-auto w-full max-w-[1800px] px-4 sm:px-6 xl:px-8">
            {isAITab ? (
              <AIKitchenMatch products={displayProducts || []} />
            ) : (
              <>
                <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{displayProducts.length} products</span>
                  {selectedCategoryName && <span>in {selectedCategoryName}</span>}
                  {searchQuery && <span>for "{searchQuery}"</span>}
                </div>

                <div className="grid gap-5 lg:hidden mb-6">
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
                    basePath="/"
                  />
                </div>

                <div className="grid gap-6 xl:grid-cols-[250px_minmax(0,1fr)] 2xl:grid-cols-[260px_minmax(0,1fr)]">
                  <aside className="hidden lg:block">
                    <div className="sticky top-[210px]">
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
                        basePath="/"
                      />
                    </div>
                  </aside>

                  <div>
                    {displayProducts.length > 0 ? (
                      <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-5 md:grid-cols-3 md:gap-x-6 md:gap-y-12 xl:grid-cols-4 2xl:gap-x-7">
                        {displayProducts.map((product: any) => (
                          <ProductCard key={product.id} product={product} />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-[28px] border border-border/50 bg-white p-12 text-center shadow-sm">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
                          <Search className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="text-2xl font-serif text-foreground">No products found</h3>
                        <p className="mt-3 text-muted-foreground">
                          Try a different search term, remove a filter, or go back to all products.
                        </p>
                        <Button asChild variant="outline" className="mt-6 rounded-full">
                          <Link href="/">View all products</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
