import Link from "next/link"
import { prisma } from "@/lib/prisma-safe"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AIKitchenMatch } from "@/components/ai-kitchen-match"
import { CategoryNavigation } from "@/components/category-navigation"
import { SaleBanner } from "@/components/sale-banner"
import { HomeMainHero } from "@/components/home-main-hero"
import { Button } from "@/components/ui/button"
import { STORE_ROOT_CATEGORY_NAMES } from "@/lib/store-catalog"
import { ProductHorizontalScroll } from "@/components/product-horizontal-scroll"
import { StorefrontGrid } from "@/components/storefront-grid"

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

  // Only fetch hero data on the unfiltered homepage — skip during category/search/sort navigation
  const isHomepage = !searchQuery && !params.category && !params.sub && !isAITab

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
      : [],
    isHomepage
      ? (prisma as any).heroBanner.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } })
      : Promise.resolve([]),
    isHomepage
      ? prisma.product.findMany({
        where: { isActive: true, isFeatured: true },
        take: 8,
        include: {
          productCategories: { include: { category: true } },
          images: { orderBy: { sortOrder: 'asc' } },
          colors: {
            orderBy: { sortOrder: 'asc' },
            include: {
              images: { orderBy: { sortOrder: 'asc' } },
              variants: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } }
            }
          },
          variants: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } }
        }
      })
      : Promise.resolve([]),
    isHomepage
      ? prisma.product.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: {
          productCategories: { include: { category: true } },
          images: { orderBy: { sortOrder: 'asc' } },
          colors: {
            orderBy: { sortOrder: 'asc' },
            include: {
              images: { orderBy: { sortOrder: 'asc' } },
              variants: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } }
            }
          },
          variants: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } }
        }
      })
      : Promise.resolve([]),
    isHomepage
      ? prisma.product.findMany({
        where: { isActive: true, compareAtPrice: { not: null } },
        take: 8,
        include: {
          productCategories: { include: { category: true } },
          images: { orderBy: { sortOrder: 'asc' } },
          colors: {
            orderBy: { sortOrder: 'asc' },
            include: {
              images: { orderBy: { sortOrder: 'asc' } },
              variants: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } }
            }
          },
          variants: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } }
        }
      })
      : Promise.resolve([]),
  ])

  const displayProducts = isAITab ? aiProducts : products
  const selectedCategoryName =
    (params.sub && childCategoryBySlug.get(params.sub)?.child.name) ||
    (params.category && categoryBySlug.get(params.category)?.name) ||
    ""

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="sticky top-0 z-50 m-0 w-full">
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
      </div>

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

        <section id="store-grid" className="pt-0 pb-4 md:pt-0 md:pb-6">
          {isAITab ? (
            <div className="w-full px-2 sm:px-3 lg:px-0">
              <AIKitchenMatch products={displayProducts || []} />
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
              products={displayProducts}
              basePath="/"
              searchQuery={searchQuery}
              selectedCategoryName={selectedCategoryName}
              scrollTargetId="store-grid"
              emptyDescription="Try a different search term, remove a filter, or go back to all products."
              emptyButtonLabel="View all products"
            />
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}
