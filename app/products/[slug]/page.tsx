import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProductGallery } from "@/components/product-gallery"
import { AddToCartButton } from "@/components/add-to-cart-button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Star, Truck } from "lucide-react"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { Card, CardContent } from "@/components/ui/card"

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const supabase = await createClient()
  const { data: product } = await supabase
    .from("products")
    .select("name, short_description")
    .eq("slug", params.slug)
    .single()

  if (!product) {
    return { title: "Product Not Found" }
  }

  return {
    title: `${product.name} | Uyarvom`,
    description: product.short_description,
  }
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient()

  const { data: product } = await supabase
    .from("products")
    .select(
      `
      *,
      category:categories(name, slug),
      images:product_images(image_url, alt_text, is_primary, display_order)
    `,
    )
    .eq("slug", params.slug)
    .eq("is_active", true)
    .single()

  if (!product) {
    notFound()
  }

  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price
  const discountPercent = hasDiscount
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0

  const sortedImages = product.images?.sort((a: any, b: any) => a.display_order - b.display_order) || []

  const isLowStock = product.stock_quantity <= product.low_stock_threshold && product.stock_quantity > 0
  const viewersCount = Math.floor(Math.random() * 50) + 20 // Mock concurrent viewers
  const recentPurchases = Math.floor(Math.random() * 30) + 10 // Mock recent purchases

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 px-6 py-8">
        <div className="container mx-auto max-w-7xl">
          {isLowStock && (
            <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center">
              <p className="font-semibold text-destructive">
                ⚡ Hurry! Only {product.stock_quantity} left in stock - Order soon to avoid missing out
              </p>
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Product Images */}
            <ProductGallery images={sortedImages} productName={product.name} />

            {/* Product Details */}
            <div className="flex flex-col">
              <div className="mb-3 flex items-center gap-2">
                <Badge variant="secondary" className="font-semibold">
                  {product.category?.name}
                </Badge>
                {isLowStock && (
                  <Badge className="bg-destructive/10 text-destructive border-destructive/30 font-semibold">
                    ⚡ Low Stock
                  </Badge>
                )}
                {product.stock_quantity <= 0 && <Badge variant="outline">Out of Stock</Badge>}
                {new Date(product.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) && (
                  <Badge className="bg-blue-500 text-white">NEW</Badge>
                )}
              </div>

              <h1 className="mb-4 font-serif text-3xl font-bold tracking-tight lg:text-4xl">{product.name}</h1>

              <div className="mb-4 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="font-bold text-lg">4.9</span>
                </div>
                <span className="text-muted-foreground">|</span>
                <span className="text-sm font-medium text-primary underline cursor-pointer">
                  Read 247 verified reviews
                </span>
              </div>

              <div className="mb-6 flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="font-medium">{viewersCount} people viewing this now</span>
                </div>
                <span className="text-muted-foreground">•</span>
                <span className="font-medium text-foreground">{recentPurchases} sold in last 24 hours</span>
              </div>

              <div className="mb-6 rounded-lg bg-secondary/30 p-4">
                <div className="flex items-baseline gap-3">
                  <span className="font-serif text-4xl font-bold">₹{product.price.toLocaleString("en-IN")}</span>
                  {hasDiscount && (
                    <>
                      <span className="text-xl text-muted-foreground line-through">
                        ₹{product.compare_at_price.toLocaleString("en-IN")}
                      </span>
                      <Badge className="bg-destructive text-destructive-foreground text-base px-3 py-1">
                        SAVE {discountPercent}%
                      </Badge>
                    </>
                  )}
                </div>
                {hasDiscount && (
                  <p className="mt-2 text-sm font-medium text-green-600">
                    You save ₹{(product.compare_at_price - product.price).toLocaleString("en-IN")} on this purchase!
                  </p>
                )}
                <p className="mt-2 text-sm text-muted-foreground">Inclusive of all taxes</p>
              </div>

              {product.short_description && (
                <p className="mb-6 text-lg leading-relaxed text-muted-foreground">{product.short_description}</p>
              )}

              <div className="mb-6">
                <AddToCartButton product={product} />
                {isLowStock && (
                  <p className="mt-2 text-center text-sm font-medium text-destructive">
                    📦 Order within 2 hours for delivery by tomorrow
                  </p>
                )}
              </div>

              <div className="mb-6 grid grid-cols-3 gap-3 rounded-lg border bg-card p-4">
                <div className="text-center">
                  <div className="mb-1 flex justify-center">
                    <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-xs font-semibold">Lifetime</p>
                  <p className="text-xs text-muted-foreground">Warranty</p>
                </div>
                <div className="text-center border-x">
                  <div className="mb-1 flex justify-center">
                    <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-xs font-semibold">7-Day Easy</p>
                  <p className="text-xs text-muted-foreground">Returns</p>
                </div>
                <div className="text-center">
                  <div className="mb-1 flex justify-center">
                    <Truck className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-xs font-semibold">Free Shipping</p>
                  <p className="text-xs text-muted-foreground">On ₹999+</p>
                </div>
              </div>

              <Separator className="my-6" />
            </div>
          </div>

          <section className="mt-16">
            <h2 className="mb-8 font-serif text-3xl font-bold">Customer Reviews</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardContent className="p-6">
                  <div className="mb-3 flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="mb-4 leading-relaxed text-muted-foreground">
                    "Exceeded my expectations! The quality is incredible and it looks beautiful in my kitchen."
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                      AK
                    </div>
                    <div>
                      <p className="font-semibold">Anita Kapoor</p>
                      <p className="text-sm text-muted-foreground">Verified Purchase • 2 days ago</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="mb-3 flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="mb-4 leading-relaxed text-muted-foreground">
                    "Worth every rupee. The craftsmanship is outstanding and delivery was super fast!"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                      VS
                    </div>
                    <div>
                      <p className="font-semibold">Vikram Singh</p>
                      <p className="text-sm text-muted-foreground">Verified Purchase • 1 week ago</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
