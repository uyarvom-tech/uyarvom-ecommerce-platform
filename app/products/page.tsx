import { createClient } from "@/lib/supabase/server"
import { ProductsHeader } from "@/components/products-header"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/product-card"
import { ProductFilters } from "@/components/product-filters"
import { AppleProductTabs, defaultProductTabs } from "@/components/apple-product-tabs"
import { AppleReveal } from "@/components/apple-scroll-animations"
import { AIKitchenMatch } from "@/components/ai-kitchen-match"
import { Search } from "lucide-react"
import { demoProducts, demoCategories } from "@/lib/demo-data"

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string; min?: string; max?: string; tab?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams

  // Check if we're on the AI tab
  const isAITab = params.tab === 'ai-match'

  let query = supabase
    .from("products")
    .select(
      `
      *,
      category:categories(name, slug),
      images:product_images(image_url, alt_text, is_primary)
    `,
    )
    .eq("is_active", true)

  // Filter by category (only if not on AI tab)
  if (params.category && !isAITab) {
    const { data: category } = await supabase.from("categories").select("id").eq("slug", params.category).single()
    if (category) {
      query = query.eq("category_id", category.id)
    }
  }

  // Filter by price range (only if not on AI tab)
  if (params.min && !isAITab) {
    query = query.gte("price", Number.parseFloat(params.min))
  }
  if (params.max && !isAITab) {
    query = query.lte("price", Number.parseFloat(params.max))
  }

  // Sort (only if not on AI tab)
  if (!isAITab) {
    const sortBy = params.sort || "newest"
    switch (sortBy) {
      case "price-asc":
        query = query.order("price", { ascending: true })
        break
      case "price-desc":
        query = query.order("price", { ascending: false })
        break
      case "name":
        query = query.order("name", { ascending: true })
        break
      default:
        query = query.order("created_at", { ascending: false })
    }
  }

  const { data: productsData } = !isAITab ? await query : { data: null }
  const { data: categoriesData } = await supabase.from("categories").select("*").is("parent_id", null).order("name")

  // Use demo data if Supabase returns empty results (development mode)
  const products = productsData && productsData.length > 0 ? productsData : demoProducts
  const categories = categoriesData && categoriesData.length > 0 ? categoriesData : demoCategories

  // Filter demo products by category if in demo mode and category is specified
  const filteredProducts = products && params.category && (!productsData || productsData.length === 0) && !isAITab
    ? products.filter((product: any) => 
        product.category?.slug === params.category || 
        product.category?.name.toLowerCase() === params.category?.toLowerCase()
      )
    : products

  return (
    <div className="flex min-h-screen flex-col bg-background apple-scroll-snap">
      <ProductsHeader categories={categories || []} />
      
      <main className="flex-1">
        {/* Search Bar Section - Only show for regular products, not AI tab */}
        {!isAITab && (
          <section className="py-4 border-b border-border/50">
            <div className="max-w-[980px] mx-auto px-6">
              <AppleReveal>
                {/* Search Bar */}
                <div className="mb-6">
                  <div className="relative max-w-md mx-auto">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      className="w-full pl-10 pr-4 py-3 rounded-full border-2 border-primary/20 focus:border-primary focus:outline-none bg-background text-foreground transition-colors"
                    />
                  </div>
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
                <AIKitchenMatch products={filteredProducts || []} />
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
                  {filteredProducts && filteredProducts.length > 0 ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredProducts.map((product: any, index: number) => (
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
                        <h3 className="text-xl font-semibold mb-2">No products found</h3>
                        <p className="apple-body">
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
