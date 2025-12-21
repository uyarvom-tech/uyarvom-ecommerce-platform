import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight } from "lucide-react"
import Image from "next/image"

export const metadata = {
  title: "Shop by Category | Uyarvom",
  description: "Browse our collection of handcrafted ceramic cookware, bakeware, dinnerware, and tools",
}

export default async function CategoriesPage() {
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from("categories")
    .select("*, products:products(count)")
    .order("display_order")

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-background to-primary/5">
        {/* Hero Section */}
        <section className="border-b bg-background">
          <div className="container mx-auto max-w-7xl px-6 py-16 text-center md:py-24">
            <h1 className="font-serif text-4xl font-bold tracking-tight text-balance md:text-6xl">
              Explore Our Collections
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground text-pretty">
              Discover handcrafted ceramic excellence across our carefully curated categories
            </p>
          </div>
        </section>

        {/* Categories Grid */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto max-w-7xl px-6">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {categories?.map((category) => {
                const productCount = Array.isArray(category.products) ? category.products.length : 0
                return (
                  <Link key={category.id} href={`/products?category=${category.slug}`}>
                    <Card className="group overflow-hidden border-2 transition-all hover:border-primary hover:shadow-lg">
                      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                        <Image
                          src={
                            category.image_url ||
                            `/placeholder.svg?height=400&width=600&query=ceramic ${category.name || "/placeholder.svg"}`
                          }
                          alt={category.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                          <h3 className="font-serif text-2xl font-bold">{category.name}</h3>
                          <p className="mt-1 text-sm text-white/90">{productCount} Products</p>
                        </div>
                      </div>
                      <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                        <div className="mt-4 flex items-center gap-2 text-sm font-medium text-primary">
                          Shop Now <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t bg-background py-16">
          <div className="container mx-auto max-w-7xl px-6 text-center">
            <h2 className="font-serif text-3xl font-bold tracking-tight">Can&apos;t decide?</h2>
            <p className="mt-4 text-muted-foreground">
              Browse all products or get in touch for personalized recommendations
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/products"
                className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                View All Products
              </Link>
              <Link
                href="/about"
                className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-8 font-medium transition-colors hover:bg-accent"
              >
                Learn More
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
