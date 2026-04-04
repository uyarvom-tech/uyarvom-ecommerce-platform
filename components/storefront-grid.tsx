"use client"

import { useState, type CSSProperties } from "react"
import Link from "next/link"
import { Search } from "lucide-react"
import { MemoizedProductCard } from "@/components/product-card"
import { ProductFilters } from "@/components/product-filters"
import { Button } from "@/components/ui/button"

interface StoreCategory {
  id: string
  name: string
  slug: string
  children?: Array<{
    id: string
    name: string
    slug: string
  }>
}

interface StorefrontGridProps {
  categories: StoreCategory[]
  products: any[]
  basePath: string
  searchQuery?: string
  selectedCategoryName?: string
  scrollTargetId?: string
  emptyTitle?: string
  emptyDescription?: string
  emptyButtonLabel?: string
}

export function StorefrontGrid({
  categories,
  products,
  basePath,
  searchQuery,
  selectedCategoryName,
  scrollTargetId = "store-grid",
  emptyTitle = "No products found",
  emptyDescription = "Try adjusting your filters or search terms.",
  emptyButtonLabel = "View all products",
}: StorefrontGridProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const gridStyle = {
    "--filters-width": isCollapsed ? "72px" : "286px",
  } as CSSProperties

  return (
    <section id={scrollTargetId} className="py-3 md:py-4">
      <div className="w-full px-2 sm:px-3 lg:px-0">
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{products.length} products</span>
          {selectedCategoryName && <span>in {selectedCategoryName}</span>}
          {searchQuery && <span>for "{searchQuery}"</span>}
        </div>

        <div className="grid gap-5 lg:hidden mb-6">
          <ProductFilters categories={categories} basePath={basePath} />
        </div>

        <div
          className="grid gap-4 lg:grid-cols-[var(--filters-width)_minmax(0,1fr)]"
          style={gridStyle}
        >
          <aside className="hidden lg:block">
            <div className="sticky top-[180px]">
              <ProductFilters
                categories={categories}
                basePath={basePath}
                scrollTargetId={scrollTargetId}
                isCollapsed={isCollapsed}
                onCollapsedChange={setIsCollapsed}
              />
            </div>
          </aside>

          <div className="min-w-0">
            {products.length > 0 ? (
              <div
                className={`grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-5 md:grid-cols-3 md:gap-x-6 md:gap-y-12 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  isCollapsed ? "xl:grid-cols-5 2xl:grid-cols-6 2xl:gap-x-7" : "xl:grid-cols-4 2xl:grid-cols-5 2xl:gap-x-7"
                }`}
              >
                {products.map((product: any) => (
                  <div key={product.id} className="min-w-0 [content-visibility:auto] [contain-intrinsic-size:1px_600px]">
                    <MemoizedProductCard product={product} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[28px] border border-border/50 bg-white p-12 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
                  <Search className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-serif text-foreground">{emptyTitle}</h3>
                <p className="mt-3 text-muted-foreground">{emptyDescription}</p>
                <Button asChild variant="outline" className="mt-6 rounded-full">
                  <Link href={basePath}>{emptyButtonLabel}</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
