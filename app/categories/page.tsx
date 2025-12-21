import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Sparkles } from "lucide-react"
import Image from "next/image"
import { demoCategories } from "@/lib/demo-data"

export const metadata = {
  title: "Shop by Category | Uyarvom",
  description: "Browse our collection of handcrafted ceramic cookware, bakeware, dinnerware, and tools",
}

export default async function CategoriesPage() {
  const supabase = await createClient()

  const { data: categoriesData } = await supabase
    .from("categories")
    .select("*, products:products(count)")
    .is("parent_id", null)
    .order("display_order", { ascending: true })

  // Use demo data if Supabase returns empty results (development mode)
  const categories = categoriesData && categoriesData.length > 0 ? categoriesData : demoCategories

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
            <div className="mb-14 text-center">
              <div className="mb-3 flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold uppercase tracking-wider text-primary">Handcrafted Collections</span>
              </div>
              <h2 className="mb-4 font-serif text-4xl font-light tracking-tight md:text-5xl">Shop by Category</h2>
              <p className="text-lg text-muted-foreground">Explore our curated collections of premium ceramic pieces</p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {categories?.map((category) => {
                const productCount = Array.isArray(category.products) ? category.products.length : 0
                return (
                  <Link key={category.id} href={`/categories/${category.slug}`} className="group">
                    <Card className="overflow-hidden border-0 bg-card shadow-sm transition-all hover:shadow-xl">
                      <div className="aspect-[4/5] overflow-hidden bg-secondary/30">
                        <Image
                          src={category.image_url || `/placeholder.svg?height=500&width=400&query=${category.name} ceramic`}
                          alt={category.name}
                          width={400}
                          height={500}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                      <CardContent className="p-6">
                        <h3 className="mb-2 font-serif text-xl font-semibold">{category.name}</h3>
                        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground mb-3">{category.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{productCount || 6} Products</span>
                          <div className="flex items-center gap-1 text-sm font-medium text-primary">
                            Shop Now <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </div>
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
