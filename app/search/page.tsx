import { prisma } from "@/lib/prisma-safe"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { SearchResults } from "@/components/search-results"
import { SearchBar } from "@/components/search-bar"
import { Suspense } from "react"
import { getVariantStockTotal } from "@/lib/variant-stock"

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>
}) {
  const params = await searchParams
  const query = params.q || ""
  const categoryFilter = params.category

  // Build search query
  const where: any = { isActive: true }

  if (query) {
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { shortDescription: { contains: query, mode: 'insensitive' } }
    ]
  }

  if (categoryFilter) {
    const category = await prisma.category.findUnique({
      where: { slug: categoryFilter }
    })
    if (category) {
      where.productCategories = {
        some: {
          categoryId: category.id
        }
      }
    }
  }

  // Get products and categories
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        productCategories: {
          include: { category: true },
          orderBy: { isPrimary: 'desc' }
        },
        images: {
          orderBy: { sortOrder: 'asc' }
        },
        colors: {
          orderBy: { sortOrder: 'asc' },
          include: {
            images: { orderBy: { sortOrder: 'asc' } },
            variants: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } }
          }
        },
        variants: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' }
      ]
    })
  ])

  // Transform products for compatibility
  const transformedProducts = products.map((product: any) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    compare_at_price: product.compareAtPrice || undefined,
    short_description: product.shortDescription,
    stock_quantity: getVariantStockTotal(product as any),
    category: product.productCategories.find((pc: any) => pc.isPrimary)?.category || product.productCategories[0]?.category,
    images: product.images.map((img: any) => ({
      image_url: img.imageUrl,
      alt_text: img.altText || undefined,
      is_primary: img.isPrimary
    })),
    colors: product.colors.map((color: any) => ({
      id: color.id,
      colorName: color.colorName,
      colorCode: color.colorCode,
      images: color.images.map((img: any) => ({
        id: img.id,
        imageUrl: img.imageUrl,
        altText: img.altText || undefined,
        sortOrder: img.sortOrder,
      })),
      variants: color.variants.map((variant: any) => ({
        id: variant.id,
        size: variant.size,
        price: variant.price,
        stock: variant.stock,
        isActive: variant.isActive,
        sku: variant.sku,
        sortOrder: variant.sortOrder,
      })),
    }))
  }))

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-muted/30 px-6 py-12">
        <div className="container mx-auto max-w-7xl">
          {/* Search Hero */}
          <div className="mb-12 text-center">
            <h1 className="font-serif mb-6 text-4xl font-bold tracking-tight text-balance md:text-5xl">
              Find Your Perfect Piece
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground text-balance">
              Explore our collection of handcrafted ceramic cookware and serveware
            </p>
            <Suspense fallback={<div>Loading...</div>}>
              <SearchBar initialQuery={query} categories={categories || []} selectedCategory={categoryFilter} />
            </Suspense>
          </div>

          {/* Results */}
          <SearchResults products={transformedProducts || []} query={query} />
        </div>
      </main>
      <Footer />
    </div>
  )
}
