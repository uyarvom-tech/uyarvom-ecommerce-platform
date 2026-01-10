import { prisma } from "@/lib/prisma"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/product-card"
import { ProductFilters } from "@/components/product-filters"
import { AIKitchenMatch } from "@/components/ai-kitchen-match"
import { CategoryNavigation } from "@/components/category-navigation"
import { CategoryCarousel } from "@/components/category-carousel"

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string; min?: string; max?: string; tab?: string; search?: string }>
}) {
  const params = await searchParams

  // Check if we're on the AI tab
  const isAITab = params.tab === 'ai-match'
  const searchQuery = params.search

  // Build where clause for products
  const where: any = { isActive: true }

  // Add search functionality
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
              name: { contains: searchQuery }
            }
          }
        }
      }
    ]
  }

  // Filter by category (only if not on AI tab)
  if (params.category && !isAITab) {
    const category = await prisma.category.findUnique({
      where: { slug: params.category }
    })
    if (category) {
      where.productCategories = {
        some: {
          categoryId: category.id
        }
      }
    }
  }

  // Filter by price range (only if not on AI tab)
  if (params.min && !isAITab) {
    where.price = { ...where.price, gte: Number.parseFloat(params.min) }
  }
  if (params.max && !isAITab) {
    where.price = { ...where.price, lte: Number.parseFloat(params.max) }
  }

  // Build orderBy clause
  let orderBy: any = { createdAt: 'desc' } // default
  if (!isAITab) {
    const sortBy = params.sort || "newest"
    switch (sortBy) {
      case "price-asc":
        orderBy = { price: 'asc' }
        break
      case "price-desc":
        orderBy = { price: 'desc' }
        break
      case "name":
        orderBy = { name: 'asc' }
        break
      default:
        orderBy = { createdAt: 'desc' }
    }
  }

  // Get products and categories
  const [products, categories] = await Promise.all([
    !isAITab ? prisma.product.findMany({
      where,
      include: {
        productCategories: {
          include: { category: true },
          orderBy: { isPrimary: 'desc' }
        },
        images: {
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy
    }) : [],
    prisma.category.findMany({
      where: { 
        isActive: true,
        parentId: null 
      },
      include: {
        _count: {
          select: {
            productCategories: true
          }
        }
      },
      orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' }
      ]
    })
  ])

  // Filter categories for showcase (first 4 categories for scroll stack)
  const showcaseCategories = categories?.slice(0, 4) || []

  // Add fallback categories if we don't have enough
  const fallbackCategories = [
    { id: 'kitchen-fallback', name: 'Kitchen', slug: 'kitchen', description: 'Premium cookware and kitchen essentials', imageUrl: null, _count: { productCategories: 50 } },
    { id: 'dining-fallback', name: 'Dining', slug: 'dining', description: 'Elegant dinnerware and serving pieces', imageUrl: null, _count: { productCategories: 30 } },
    { id: 'decor-fallback', name: 'Home Decor', slug: 'decor', description: 'Beautiful decorative pieces for your home', imageUrl: null, _count: { productCategories: 25 } },
    { id: 'gifts-fallback', name: 'Gifts', slug: 'gifts', description: 'Perfect gifts for every occasion', imageUrl: null, _count: { productCategories: 20 } }
  ]

  // Ensure we have at least 4 categories for the carousel
  const finalShowcaseCategories = showcaseCategories.length >= 4 
    ? showcaseCategories 
    : [...showcaseCategories, ...fallbackCategories.slice(0, 4 - showcaseCategories.length)]

  // For AI tab, get all products
  const aiProducts = isAITab ? await prisma.product.findMany({
    where: { isActive: true },
    include: {
      productCategories: {
        include: { category: true },
        orderBy: { isPrimary: 'desc' }
      },
      images: {
        orderBy: { sortOrder: 'asc' }
      }
    }
  }) : []

  const displayProducts = isAITab ? aiProducts : products
  return (
    <div className="flex min-h-screen flex-col bg-background apple-scroll-snap">
      <Header />
      
      {/* Category Navigation */}
      <CategoryNavigation />
      
      {/* Category Carousel - Only show if not on AI tab */}
      {!isAITab && (
        <CategoryCarousel categories={finalShowcaseCategories} />
      )}
      
      <main className="flex-1">
        {/* Apple Product Grid */}
        <section className="py-8">
          <div className="w-full">
            {isAITab ? (
              /* AI Kitchen Match Interface */
              <div className="max-w-[1400px] mx-auto px-4">
                <AIKitchenMatch products={displayProducts || []} />
              </div>
            ) : (
              /* Regular Product Grid */
              <div className="flex gap-6">
                {/* Sidebar Filters - Desktop Only - Goes to left edge */}
                <aside className="hidden lg:block w-80 flex-shrink-0 pl-4">
                  <div className="apple-card p-6 sticky top-20">
                    <ProductFilters categories={categories || []} />
                  </div>
                </aside>

                {/* Product Grid - Full width */}
                <div className="flex-1 min-w-0 pr-4">
                  {/* Search Results Indicator */}
                  {searchQuery && (
                    <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg max-w-[1400px] mx-auto">
                      <p className="text-sm text-primary">
                        Showing {displayProducts?.length || 0} results for "<strong>{searchQuery}</strong>"
                      </p>
                    </div>
                  )}
                  
                  {displayProducts && displayProducts.length > 0 ? (
                    <div className="max-w-[1400px] mx-auto">
                      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {displayProducts.map((product: any, index: number) => (
                          <ProductCard key={product.id} product={product} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-[1400px] mx-auto">
                      <div className="apple-card p-12 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                          <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">
                          {searchQuery ? `No products found for "${searchQuery}"` : "No products found"}
                        </h3>
                        <p className="apple-body">
                          {searchQuery 
                            ? "Try adjusting your search terms or browse our categories above."
                            : "Try adjusting your filters or search terms"
                          }
                          {params.category 
                            ? `No products found in ${params.category} category. Try browsing all products.`
                            : ""
                          }
                        </p>
                      </div>
                    </div>
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