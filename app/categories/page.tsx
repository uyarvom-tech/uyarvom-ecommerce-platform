import { prisma } from "@/lib/prisma"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { CategoryTiltedCard } from "@/components/category-tilted-card"
import ScrollFloat from "@/components/ScrollFloat"

export const metadata = {
  title: "Shop by Category | Uyarvom",
  description: "Browse our collection of handcrafted ceramic cookware, bakeware, dinnerware, and tools",
}

export default async function CategoriesPage() {
  // Get categories from admin-configured database
  const categories = await prisma.category.findMany({
    where: { 
      isActive: true,
      parentId: null // Only root categories
    },
    include: {
      _count: {
        select: {
          productCategories: true
        }
      }
    },
    orderBy: [
      { displayOrder: 'asc' },
      { name: 'asc' }
    ]
  })

  // Transform for compatibility with CategoryTiltedCard
  const transformedCategories = categories.map(category => ({
    ...category,
    products: { count: category._count.productCategories }
  }))

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-background to-primary/5">
        {/* Categories Grid */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto max-w-7xl px-6">
            <div className="mb-14 text-center">
              {/* Desktop: Animated, Mobile: Static */}
              <div className="mb-4 font-serif text-4xl font-light tracking-tight md:text-5xl">
                <span className="hidden md:block">
                  <ScrollFloat
                    animationDuration={1.2}
                    ease="back.inOut(2)"
                    scrollStart="center bottom+=50%"
                    scrollEnd="bottom bottom-=40%"
                    stagger={0.03}
                  >
                    Shop by Category
                  </ScrollFloat>
                </span>
                <span className="block md:hidden">
                  Shop by Category
                </span>
              </div>
              <p className="text-lg text-muted-foreground">Explore our curated collections of premium ceramic pieces</p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 place-items-center">
              {transformedCategories?.map((category) => (
                <CategoryTiltedCard key={category.id} category={category} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t bg-background py-16">
          <div className="container mx-auto max-w-7xl px-6 text-center">
            {/* Desktop: Animated, Mobile: Static */}
            <div className="font-serif text-3xl font-bold tracking-tight">
              <span className="hidden md:block">
                <ScrollFloat
                  animationDuration={1}
                  ease="back.inOut(2)"
                  scrollStart="center bottom+=30%"
                  scrollEnd="bottom bottom-=30%"
                  stagger={0.05}
                >
                  Can't decide?
                </ScrollFloat>
              </span>
              <span className="block md:hidden">
                Can't decide?
              </span>
            </div>
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
