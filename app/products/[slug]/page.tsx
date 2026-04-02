import { prisma } from "@/lib/prisma-safe"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import FlipkartProductGallery from "@/components/flipkart-product-gallery"
import { ProductActionArea } from "@/components/product-action-area"
import { ProductReviews } from "@/components/product-reviews"
import { ProductVariantProvider } from "@/components/product-variant-context"
import { Star } from "lucide-react"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { TrustBlocks } from "@/components/trust-blocks"
import { getVariantStockTotal } from "@/lib/variant-stock"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params

  const product = await prisma.product.findUnique({
    where: { slug },
    select: { name: true, shortDescription: true },
  })

  if (!product) {
    return { title: "Product Not Found" }
  }

  return {
    title: `${product.name} | Uyarvom`,
    description: product.shortDescription,
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  const product = await prisma.product.findUnique({
    where: {
      slug,
      isActive: true,
    },
    include: {
      productCategories: {
        include: { category: true },
        orderBy: { isPrimary: "desc" },
      },
      images: {
        orderBy: { sortOrder: "asc" },
      },
      colors: {
        orderBy: { sortOrder: "asc" },
        include: {
          images: {
            orderBy: { sortOrder: "asc" },
          },
          variants: {
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
          },
        },
      },
      reviews: {
        select: {
          rating: true,
        },
      },
    },
  })

  if (!product) {
    notFound()
  }

  const reviewStats = {
    totalReviews: product.reviews.length,
    averageRating:
      product.reviews.length > 0
        ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
        : 0,
  }

  const primaryCategory =
    product.productCategories.find((pc) => pc.isPrimary)?.category || product.productCategories[0]?.category

  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price
  const legacyImages = product.images || []
  const stockQuantity = getVariantStockTotal(product as any)
  const isLowStock = stockQuantity <= product.lowStockThreshold && stockQuantity > 0

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-12 lg:py-20">
          {isLowStock && (
            <div className="mb-10 p-4 border-l-2 border-primary bg-primary/5">
              <p className="text-xs uppercase tracking-[0.2em] font-bold text-primary">
                Limited Availability. Only {stockQuantity} pieces remain in our current curation.
              </p>
            </div>
          )}

          <div className="grid gap-16 lg:grid-cols-2 lg:items-start">
            <ProductVariantProvider productColors={product.colors as any}>
              <div className="sticky top-32">
                <FlipkartProductGallery
                  colors={product.colors as any}
                  legacyImages={legacyImages}
                  productName={product.name}
                />
              </div>

              <div className="flex flex-col space-y-10">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <span className="text-primary text-[10px] font-bold uppercase tracking-[0.4em]">
                      {primaryCategory?.name || "Artisanal Collection"}
                    </span>
                    <div className="h-[1px] w-8 bg-border"></div>
                    {new Date(product.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) && (
                      <span className="text-foreground text-[10px] font-bold uppercase tracking-[0.4em]">
                        New Arrival
                      </span>
                    )}
                  </div>

                  <h1 className="text-4xl md:text-6xl font-serif text-foreground leading-[1.1]">
                    {product.name}
                  </h1>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-1.5">
                      {[...Array(5)].map((_, index) => (
                        <Star
                          key={index}
                          className={`h-3 w-3 ${index < Math.round(reviewStats.averageRating)
                            ? "fill-primary text-primary"
                            : "fill-border text-border"
                            }`}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-foreground/40">
                      {reviewStats.totalReviews} Customer Reviews
                    </span>
                  </div>
                </div>

                <ProductActionArea product={product} hasDiscount={!!hasDiscount} />

                <TrustBlocks />
              </div>
            </ProductVariantProvider>
          </div>

          <section className="mt-32 border-t border-border pt-20">
            <div className="flex flex-col items-center text-center space-y-10 mb-20">
              <span className="text-primary text-[10px] font-bold uppercase tracking-[0.5em]">
                Verified Reflections
              </span>
              <h2 className="text-4xl md:text-5xl font-serif">
                Customer <span className="text-primary italic">Perspectives</span>
              </h2>
              <div className="h-16 w-[1px] bg-primary/20"></div>
            </div>
            <ProductReviews productSlug={product.slug} currentUserId={authUser?.id} />
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
