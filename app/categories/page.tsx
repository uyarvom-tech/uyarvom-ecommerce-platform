import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { CategoryTiltedCard } from "@/components/category-tilted-card"
import ScrollFloat from "@/components/ScrollFloat"
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
        {/* Categories Grid */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto max-w-7xl px-6">
            <div className="mb-14 text-center">
              <ScrollFloat
                animationDuration={1.2}
                ease="back.inOut(2)"
                scrollStart="center bottom+=50%"
                scrollEnd="bottom bottom-=40%"
                stagger={0.03}
                className="mb-4 font-serif text-4xl font-light tracking-tight md:text-5xl"
              >
                Shop by Category
              </ScrollFloat>
              <p className="text-lg text-muted-foreground">Explore our curated collections of premium ceramic pieces</p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 place-items-center">
              {categories?.map((category) => (
                <CategoryTiltedCard key={category.id} category={category} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t bg-background py-16">
          <div className="container mx-auto max-w-7xl px-6 text-center">
            <ScrollFloat
              animationDuration={1}
              ease="back.inOut(2)"
              scrollStart="center bottom+=30%"
              scrollEnd="bottom bottom-=30%"
              stagger={0.05}
              className="font-serif text-3xl font-bold tracking-tight"
            >
              Can't decide?
            </ScrollFloat>
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
