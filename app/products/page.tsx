import { prisma } from "@/lib/prisma"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/product-card"
import { ProductFilters } from "@/components/product-filters"
import { AppleReveal } from "@/components/apple-scroll-animations"
import { AIKitchenMatch } from "@/components/ai-kitchen-match"
import { ProductsSearch } from "@/components/products-search"
import { Search } from "lucide-react"

export default async function ProductsPage({
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
      orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' }
      ]
    })
  ])

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
      
      <main className="flex-1">
        {/* Search Bar Section - Only show for regular products, not AI tab */}
        {!isAITab && (
          <section className="py-4 border-b border-border/50">
            <div className="max-w-[980px] mx-auto px-6">
              <AppleReveal>
                {/* Functional Search Bar */}
                <div className="mb-6">
                  <ProductsSearch />
                </div>
                
                {params.category && (
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">
                      Showing: <span className="font-medium text-primary capitalize">{params.category}</span>
                    </div>
                  </div>
                )}
              </AppleReveal>
            </div>
          </section>
        )}

        {/* Apple Product Grid */}
        <section className="py-8">
          <div className="max-w-[1200px] mx-auto px-6">
            {isAITab ? (
              /* AI Kitchen Match Interface */
              <AppleReveal>
                <AIKitchenMatch products={displayProducts || []} />
              </AppleReveal>
            ) : (
              /* Regular Product Grid */
              <div className="grid gap-6 lg:grid-cols-4">
                {/* Sidebar Filters - Desktop Only */}
                <aside className="hidden lg:block lg:col-span-1">
                  <AppleReveal delay={100}>
                    <div className="apple-card p-6 sticky top-20">
                      <ProductFilters categories={categories || []} />
                    </div>
                  </AppleReveal>
                </aside>

                {/* Product Grid - Full width on mobile, 3/4 on desktop */}
                <div className="lg:col-span-3">
                  {/* Search Results Indicator */}
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
                          <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">
                          {searchQuery ? `No products found for "${searchQuery}"` : "No products found"}
                        </h3>
                        <p className="apple-body">
                          {searchQuery 
                            ? "Try adjusting your search terms or browse our categories below."
                            : "Try adjusting your filters or browse our categories below."
                          }
                          {params.category 
                            ? `No products found in ${params.category} category. Try browsing all products.`
                            : "Try adjusting your filters or search terms"
                          }
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
