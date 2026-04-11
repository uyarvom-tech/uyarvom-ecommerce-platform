import { prisma } from "@/lib/prisma-safe"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import FlipkartProductGallery from "@/components/flipkart-product-gallery"
import { ProductActionArea } from "@/components/product-action-area"
import { ProductReviews } from "@/components/product-reviews"
import { ProductVariantProvider } from "@/components/product-variant-context"
import { WishlistButton } from "@/components/wishlist-button"
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
      variants: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
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
        <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-4 sm:py-10 lg:py-16">
          {isLowStock && (
            <div className="mb-6 border-l-2 border-primary bg-primary/5 p-3 sm:mb-10 sm:p-4">
              <p className="text-xs uppercase tracking-[0.2em] font-bold text-primary">
                Limited Availability. Only {stockQuantity} pieces remain in our current curation.
              </p>
            </div>
          )}

          <div className="mb-6 hidden inline-flex rounded-full border border-border/70 bg-white px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.22em] text-foreground/70 sm:mb-8 sm:inline-flex sm:px-4 sm:py-2 sm:text-[10px]">
            {stockQuantity > 0 ? `${stockQuantity} in stock` : "Out of stock"}
          </div>

          <div className="grid gap-6 lg:grid-cols-2 lg:items-start lg:gap-16">
            <ProductVariantProvider productColors={product.colors as any} productVariants={product.variants as any}>
              <div className="md:sticky md:top-28">
                <FlipkartProductGallery
                  colors={product.colors as any}
                  legacyImages={legacyImages}
                  productName={product.name}
                />
              </div>

              <div className="flex flex-col space-y-8 md:space-y-10">
                <div className="space-y-5 md:space-y-6">
                  <div className="flex items-start justify-between gap-3 md:gap-4">
                    <div className="flex flex-wrap items-center gap-3 md:gap-4">
                      <span className="text-primary text-[9px] font-bold uppercase tracking-[0.3em] sm:text-[10px] sm:tracking-[0.4em]">
                        {primaryCategory?.name || "Artisanal Collection"}
                      </span>
                      <div className="h-[1px] w-8 bg-border"></div>
                      {new Date(product.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) && (
                        <span className="text-foreground text-[9px] font-bold uppercase tracking-[0.3em] sm:text-[10px] sm:tracking-[0.4em]">
                          New Arrival
                        </span>
                      )}
                    </div>
                    <div className="hidden md:block">
                      <WishlistButton
                        productId={product.id}
                        className="h-11 w-11 rounded-full border-border/70 bg-white text-foreground shadow-sm hover:bg-primary hover:text-white"
                      />
                    </div>
                  </div>

                  <h1 className="max-w-[12ch] text-[2rem] font-serif leading-[1.05] text-foreground sm:text-4xl md:max-w-none md:text-6xl">
                    {product.name}
                  </h1>

                  <div className="flex items-center gap-3 sm:gap-6">
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
                    <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 sm:text-[11px]">
                      {reviewStats.totalReviews} Customer Reviews
                    </span>
                  </div>
                </div>

                <ProductActionArea product={product} hasDiscount={!!hasDiscount} />

                <div className="hidden md:block">
                  <TrustBlocks />
                </div>
              </div>
            </ProductVariantProvider>
          </div>

          <section className="mt-20 border-t border-border pt-12 md:mt-32 md:pt-20">
            <div className="mb-12 flex flex-col items-center space-y-6 text-center md:mb-20 md:space-y-10">
              <span className="text-primary text-[9px] font-bold uppercase tracking-[0.35em] sm:text-[10px] sm:tracking-[0.5em]">
                Verified Reflections
              </span>
              <h2 className="text-3xl font-serif md:text-5xl">
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
