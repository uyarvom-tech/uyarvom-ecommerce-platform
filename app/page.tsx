import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Star, Sparkles } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { DevNotice } from "@/components/dev-notice"
import { demoProducts } from "@/lib/demo-data"

export default async function HomePage() {
  const supabase = await createClient()

  // Fetch featured products
  const { data: featuredProductsData } = await supabase
    .from("products")
    .select(
      `
      *,
      category:categories(name, slug),
      images:product_images(image_url, alt_text, is_primary)
    `,
    )
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(6)

  // Use demo data if Supabase returns empty results (development mode)
  const featuredProducts = featuredProductsData && featuredProductsData.length > 0 ? featuredProductsData : demoProducts

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <div className="container mx-auto max-w-7xl px-6 pt-4">
        <DevNotice />
      </div>

      <section className="relative overflow-hidden px-6 py-24 md:py-40">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex items-center gap-2 text-sm uppercase tracking-widest text-primary">
              <div className="h-px w-8 bg-primary/30"></div>
              <span className="font-medium">Handcrafted Excellence Since 2020</span>
              <div className="h-px w-8 bg-primary/30"></div>
            </div>

            <h1 className="mb-8 max-w-4xl font-serif text-5xl font-light leading-[1.1] tracking-tight text-balance md:text-7xl lg:text-8xl">
              Transform Every Meal Into a{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Masterpiece</span>
            </h1>

            <p className="mb-8 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl">
              Join 10,000+ home chefs who've elevated their cooking with our premium ceramic cookware. Handcrafted for
              perfection, designed to last generations.
            </p>

            <div className="mb-10 flex flex-wrap items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                <span className="font-medium">4.9/5 from 2,847 reviews</span>
              </div>
              <div className="h-4 w-px bg-border"></div>
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-medium">10,000+ Happy Customers</span>
              </div>
              <div className="h-4 w-px bg-border"></div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="font-medium">Featured in 15+ Publications</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" className="h-14 px-8 text-base shadow-xl shadow-primary/20" asChild>
                <Link href="/products">
                  Explore Collection
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-8 text-base border-foreground/20 bg-transparent"
                asChild
              >
                <Link href="/categories">Browse by Category</Link>
              </Button>
            </div>

            <p className="mt-8 text-sm text-muted-foreground">
              ✓ Free Shipping on Orders ₹999+ | ✓ 7-Day Easy Returns | ✓ Lifetime Warranty
            </p>
          </div>
        </div>

        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-secondary/30 via-background to-background"></div>
      </section>

      <section className="border-y border-primary/20 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 px-6 py-4">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-center gap-2 text-center sm:flex-row sm:gap-4">
            <Badge className="bg-destructive text-destructive-foreground border-0 px-3 py-1 font-semibold">
              LIMITED TIME
            </Badge>
            <p className="text-sm font-medium md:text-base">
              Get <span className="font-bold text-primary">20% OFF</span> on your first purchase + Free Shipping |{" "}
              <span className="text-muted-foreground">Code: WELCOME20</span>
            </p>
          </div>
        </div>
      </section>

      <section className="bg-secondary/20 px-6 py-20 md:py-28">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-14 flex items-end justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold uppercase tracking-wider text-primary">Trending This Week</span>
              </div>
              <h2 className="mb-3 font-serif text-4xl font-light tracking-tight md:text-5xl">Customer Favorites</h2>
              <p className="text-muted-foreground">Most loved products by our community</p>
            </div>
            <Button variant="ghost" className="hidden md:inline-flex" asChild>
              <Link href="/products">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {featuredProducts?.map((product, index) => {
              const primaryImage = product.images?.find((img) => img.is_primary) || product.images?.[0]
              const hasDiscount = product.compare_at_price && product.compare_at_price > product.price
              const discountPercent = hasDiscount
                ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
                : 0

              const stockLevel = product.stock_quantity
              const isLowStock = stockLevel <= product.low_stock_threshold && stockLevel > 0
              const viewCount = 100 + index * 47 // Mock view count for demo

              return (
                <Link key={product.id} href={`/products/${product.slug}`} className="group">
                  <Card className="overflow-hidden border-0 bg-card shadow-md transition-all hover:shadow-2xl hover:-translate-y-1">
                    <div className="relative aspect-square overflow-hidden bg-secondary/30">
                      <Image
                        src={primaryImage?.image_url || `/placeholder.svg?height=600&width=600&query=${product.name}`}
                        alt={primaryImage?.alt_text || product.name}
                        width={600}
                        height={600}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>

                      <div className="absolute right-3 top-3 flex flex-col gap-2">
                        {hasDiscount && (
                          <Badge className="bg-destructive text-destructive-foreground border-0 px-3 py-1.5 font-bold shadow-lg">
                            SAVE {discountPercent}%
                          </Badge>
                        )}
                        {index === 0 && (
                          <Badge className="bg-amber-500 text-white border-0 px-3 py-1.5 font-bold shadow-lg">
                            🔥 BESTSELLER
                          </Badge>
                        )}
                      </div>

                      {isLowStock && (
                        <div className="absolute bottom-3 left-3">
                          <Badge
                            variant="secondary"
                            className="border border-destructive/30 bg-destructive/10 text-destructive font-semibold backdrop-blur-sm"
                          >
                            ⚡ Only {stockLevel} left
                          </Badge>
                        </div>
                      )}
                    </div>

                    <CardContent className="p-6">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
                        {product.category?.name}
                      </p>
                      <h3 className="mb-3 font-serif text-xl font-semibold leading-tight group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {product.short_description}
                      </p>

                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex flex-col">
                          <div className="flex items-baseline gap-2">
                            <span className="font-serif text-2xl font-bold text-foreground">
                              ₹{product.price.toLocaleString("en-IN")}
                            </span>
                            {hasDiscount && (
                              <span className="text-sm text-muted-foreground line-through">
                                ₹{product.compare_at_price.toLocaleString("en-IN")}
                              </span>
                            )}
                          </div>
                          {hasDiscount && (
                            <span className="text-xs font-medium text-green-600">
                              You save ₹{(product.compare_at_price - product.price).toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            <span className="font-bold text-sm">4.9</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{viewCount}+ views</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span>{12 + index * 3} people bought this recently</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>

          <div className="mt-10 text-center md:hidden">
            <Button variant="outline" asChild>
              <Link href="/products">
                View All Products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 md:py-28">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 font-serif text-3xl font-light tracking-tight md:text-4xl">
              Why 10,000+ Customers Trust Uyarvom
            </h2>
            <p className="text-muted-foreground">Exceptional quality backed by unmatched service</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20 shadow-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="mb-3 font-serif text-xl font-semibold">Lifetime Warranty</h3>
              <p className="leading-relaxed text-muted-foreground">
                Every piece is backed by our lifetime warranty. If it breaks, we'll replace it—no questions asked.
              </p>
            </div>

            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20 shadow-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="mb-3 font-serif text-xl font-semibold">100% Secure Checkout</h3>
              <p className="leading-relaxed text-muted-foreground">
                Your payment information is encrypted and secure. We never store your card details.
              </p>
            </div>

            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20 shadow-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="mb-3 font-serif text-xl font-semibold">Fast & Free Delivery</h3>
              <p className="leading-relaxed text-muted-foreground">
                Free shipping on orders over ₹999. Most orders arrive within 3-5 business days.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t bg-secondary/10 px-6 py-20 md:py-28">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <h2 className="mb-4 font-serif text-4xl font-light tracking-tight md:text-5xl">
              Loved by Home Chefs Everywhere
            </h2>
            <p className="text-muted-foreground">Don't just take our word for it</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="mb-4 leading-relaxed text-muted-foreground">
                  "Absolutely love my new cookware set! The quality is outstanding and it heats so evenly. Best kitchen
                  investment I've made."
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                    PA
                  </div>
                  <div>
                    <p className="font-semibold">Priya Anand</p>
                    <p className="text-sm text-muted-foreground">Verified Buyer</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="mb-4 leading-relaxed text-muted-foreground">
                  "The craftsmanship is exceptional. You can tell these are made to last. Plus the customer service is
                  top-notch!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                    RK
                  </div>
                  <div>
                    <p className="font-semibold">Rajesh Kumar</p>
                    <p className="text-sm text-muted-foreground">Verified Buyer</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="mb-4 leading-relaxed text-muted-foreground">
                  "Beautiful products that actually work great too! They've transformed my cooking experience and look
                  stunning in my kitchen."
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                    SM
                  </div>
                  <div>
                    <p className="font-semibold">Sneha Malhotra</p>
                    <p className="text-sm text-muted-foreground">Verified Buyer</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
