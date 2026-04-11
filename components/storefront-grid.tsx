"use client"

import { useState, type CSSProperties } from "react"
import Link from "next/link"
import { Search, SlidersHorizontal } from "lucide-react"
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
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)

  const gridStyle = {
    "--filters-width": isCollapsed ? "72px" : "286px",
  } as CSSProperties

  return (
    <section id={scrollTargetId} className="py-3 md:py-4">
      <div className="w-full px-4 sm:px-6 lg:px-0">
        <div className="mb-4 flex items-center justify-between gap-3 text-sm text-muted-foreground md:mb-6">
          <div className="min-w-0">
            <span className="block font-medium text-foreground">{products.length} products</span>
            <div className="mt-0.5 hidden text-[11px] sm:block">
              {selectedCategoryName && <span>in {selectedCategoryName}</span>}
              {searchQuery && <span>for "{searchQuery}"</span>}
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsMobileFiltersOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-full border-border/60 bg-white px-4 text-[10px] font-bold uppercase tracking-[0.18em] shadow-sm lg:hidden"
            aria-label="Open filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </Button>
        </div>

        <div className="mb-4 flex items-center gap-2 text-[11px] text-muted-foreground lg:hidden">
          {selectedCategoryName && <span>in {selectedCategoryName}</span>}
          {searchQuery && <span>for "{searchQuery}"</span>}
        </div>

        <div className="grid gap-4 lg:grid-cols-[var(--filters-width)_minmax(0,1fr)]" style={gridStyle}>
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
                className={`grid grid-cols-2 gap-3 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:grid-cols-3 md:gap-6 ${
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

      <div
        className={`fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden ${
          isMobileFiltersOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsMobileFiltersOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={`fixed left-0 top-0 z-[70] h-dvh w-[min(86vw,22rem)] border-r border-border/10 bg-background shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:hidden ${
          isMobileFiltersOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <ProductFilters
          categories={categories}
          basePath={basePath}
          scrollTargetId={scrollTargetId}
          mobileDrawer
          onMobileDrawerClose={() => setIsMobileFiltersOpen(false)}
        />
      </aside>
    </section>
  )
}
