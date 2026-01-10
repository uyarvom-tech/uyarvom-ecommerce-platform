import { ProductCard } from "@/components/product-card"
import { SearchX } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface Product {
  id: string
  name: string
  slug: string
  price: number
  compare_at_price?: number
  short_description: string | null | undefined
  stock_quantity: number
  category?: { name: string; slug: string }
  images: Array<{ image_url: string; alt_text?: string; is_primary: boolean }>
}

export function SearchResults({ products, query }: { products: Product[]; query: string }) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <SearchX className="mb-6 h-24 w-24 text-muted-foreground/50" />
        <h2 className="font-serif mb-3 text-2xl font-semibold">No products found</h2>
        <p className="mb-8 text-muted-foreground">
          {query
            ? `We couldn't find any products matching "${query}"`
            : "Try adjusting your search or browse all products"}
        </p>
        <Button asChild size="lg">
          <Link href="/products">Browse All Products</Link>
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Found <span className="font-semibold text-foreground">{products.length}</span> product
          {products.length !== 1 ? "s" : ""}
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}
