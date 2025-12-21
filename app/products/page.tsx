import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/product-card"
import { ProductFilters } from "@/components/product-filters"
import { demoProducts, demoCategories } from "@/lib/demo-data"

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string; min?: string; max?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams

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

  // Filter by category
  if (params.category) {
    const { data: category } = await supabase.from("categories").select("id").eq("slug", params.category).single()
    if (category) {
      query = query.eq("category_id", category.id)
    }
  }

  // Filter by price range
  if (params.min) {
    query = query.gte("price", Number.parseFloat(params.min))
  }
  if (params.max) {
    query = query.lte("price", Number.parseFloat(params.max))
  }

  // Sort
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

  const { data: productsData } = await query
  const { data: categoriesData } = await supabase.from("categories").select("*").is("parent_id", null).order("name")

  // Use demo data if Supabase returns empty results (development mode)
  const products = productsData && productsData.length > 0 ? productsData : demoProducts
  const categories = categoriesData && categoriesData.length > 0 ? categoriesData : demoCategories

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 px-6 py-8">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold tracking-tight">All Products</h1>
            <p className="text-muted-foreground">Browse our complete collection of ceramic houseware</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-4">
            <aside className="lg:col-span-1">
              <ProductFilters categories={categories || []} />
            </aside>

            <div className="lg:col-span-3">
              {products && products.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
                  <p className="text-muted-foreground">No products found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
