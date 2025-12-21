import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { SearchResults } from "@/components/search-results"
import { SearchBar } from "@/components/search-bar"
import { Suspense } from "react"

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>
}) {
  const params = await searchParams
  const query = params.q || ""
  const categoryFilter = params.category

  const supabase = await createClient()

  let productsQuery = supabase
    .from("products")
    .select(
      `
      *,
      category:categories(name, slug),
      images:product_images(image_url, alt_text, is_primary)
    `,
    )
    .eq("is_active", true)

  if (query) {
    productsQuery = productsQuery.or(
      `name.ilike.%${query}%,description.ilike.%${query}%,short_description.ilike.%${query}%`,
    )
  }

  if (categoryFilter) {
    const { data: category } = await supabase.from("categories").select("id").eq("slug", categoryFilter).single()

    if (category) {
      productsQuery = productsQuery.eq("category_id", category.id)
    }
  }

  const { data: products } = await productsQuery.order("created_at", { ascending: false }).limit(50)

  const { data: categories } = await supabase.from("categories").select("*").order("display_order")

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-muted/30 px-6 py-12">
        <div className="container mx-auto max-w-7xl">
          {/* Search Hero */}
          <div className="mb-12 text-center">
            <h1 className="font-serif mb-6 text-4xl font-bold tracking-tight text-balance md:text-5xl">
              Find Your Perfect Piece
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground text-balance">
              Explore our collection of handcrafted ceramic cookware and serveware
            </p>
            <Suspense fallback={<div>Loading...</div>}>
              <SearchBar initialQuery={query} categories={categories || []} selectedCategory={categoryFilter} />
            </Suspense>
          </div>

          {/* Results */}
          <SearchResults products={products || []} query={query} />
        </div>
      </main>
      <Footer />
    </div>
  )
}
