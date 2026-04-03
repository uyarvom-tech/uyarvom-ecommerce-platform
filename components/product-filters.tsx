"use client"

import { useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SlidersHorizontal, X } from "lucide-react"

interface FilterCategory {
  id: string
  name: string
  slug: string
  children?: Array<{
    id: string
    name: string
    slug: string
  }>
}

export function ProductFilters({
  categories,
  basePath = "/",
  scrollTargetId = "store-grid",
}: {
  categories: FilterCategory[]
  basePath?: string
  scrollTargetId?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [minPrice, setMinPrice] = useState(searchParams.get("min") || "")
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max") || "")
  const [isCollapsed, setIsCollapsed] = useState(false)

  const activeCategory = searchParams.get("category") || ""
  const activeSubCategory = searchParams.get("sub") || ""
  const activeSort = searchParams.get("sort") || "newest"

  const selectedCategory = useMemo(
    () => categories.find((category) => category.slug === activeCategory),
    [categories, activeCategory]
  )

  const pushParams = (updater: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString())
    updater(params)
    const query = params.toString()
    router.push(query ? `${basePath}?${query}` : basePath, { scroll: false })
    window.setTimeout(() => {
      document.getElementById(scrollTargetId)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }, 0)
  }

  const clearAll = () => {
    setMinPrice("")
    setMaxPrice("")
    router.push(basePath, { scroll: false })
  }

  return (
    <div className={`overflow-hidden rounded-[28px] border border-border/60 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.06)] transition-all duration-300 ease-out ${isCollapsed ? "w-[68px]" : "w-full max-w-[286px]"}`}>
      <div className={`border-b border-border/50 ${isCollapsed ? "p-2" : "bg-gradient-to-r from-primary/8 to-transparent p-4"}`}>
        <div className={`flex items-center ${isCollapsed ? "flex-col gap-2" : "justify-between gap-3"}`}>
          <div className={`inline-flex items-center gap-2 rounded-full bg-primary/8 font-bold uppercase tracking-[0.24em] text-primary ${isCollapsed ? "px-2 py-2 text-[8px] [writing-mode:vertical-rl] rotate-180 rounded-full" : "px-3 py-1 text-[10px]"}`}>
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {!isCollapsed && "Filters"}
          </div>
          <Button
            variant="ghost"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className={`text-[11px] font-semibold text-muted-foreground hover:text-primary ${isCollapsed ? "h-10 w-10 rounded-full px-0" : "h-8 px-3"}`}
            aria-label={isCollapsed ? "Show filters" : "Hide filters"}
          >
            {isCollapsed ? ">" : "Hide"}
          </Button>
        </div>

        {!isCollapsed && (
          <div className="mt-3 flex items-center justify-between gap-2">
            <Button variant="ghost" onClick={clearAll} className="h-8 px-3 text-[11px] text-muted-foreground hover:text-primary">
              Clear
            </Button>
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70">
              Narrow and quick
            </span>
          </div>
        )}
      </div>

      <div className={`overflow-hidden transition-all duration-300 ease-out ${isCollapsed ? "max-h-0 opacity-0" : "max-h-[1200px] opacity-100"}`}>
        <div className="space-y-4 overflow-y-auto overscroll-contain p-4 pr-3 md:max-h-[calc(100vh-14rem)]">
          {(activeCategory || activeSubCategory || minPrice || maxPrice || activeSort !== "newest") && (
            <div className="flex flex-wrap gap-2">
              {activeCategory && (
                <button
                  type="button"
                  onClick={() =>
                    pushParams((params) => {
                      params.delete("category")
                      params.delete("sub")
                    })
                  }
                  className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary"
                >
                  {selectedCategory?.name || activeCategory}
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              {activeSubCategory && (
                <button
                  type="button"
                  onClick={() => pushParams((params) => params.delete("sub"))}
                  className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary"
                >
                  {selectedCategory?.children?.find((child) => child.slug === activeSubCategory)?.name || activeSubCategory}
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              {(minPrice || maxPrice) && (
                <button
                  type="button"
                  onClick={() =>
                    pushParams((params) => {
                      params.delete("min")
                      params.delete("max")
                      setMinPrice("")
                      setMaxPrice("")
                    })
                  }
                  className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary"
                >
                  Price range
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          <section className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground/75">Category</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  pushParams((params) => {
                    params.delete("category")
                    params.delete("sub")
                  })
                }
                className={`rounded-full px-4 py-2 text-sm transition-all ${
                  !activeCategory ? "bg-primary text-white" : "bg-secondary/70 text-foreground hover:bg-secondary"
                }`}
              >
                All Products
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() =>
                    pushParams((params) => {
                      params.set("category", category.slug)
                      params.delete("sub")
                    })
                  }
                  className={`rounded-full px-4 py-2 text-sm transition-all ${
                    activeCategory === category.slug
                      ? "bg-primary text-white"
                      : "bg-secondary/70 text-foreground hover:bg-secondary"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </section>

          {selectedCategory && selectedCategory.children && selectedCategory.children.length > 0 && (
            <section className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground/75">Subcategory</p>
              <div className="grid grid-cols-1 gap-2">
                {selectedCategory.children.map((child) => (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => pushParams((params) => params.set("sub", child.slug))}
                    className={`rounded-xl border px-4 py-2.5 text-left text-sm transition-all ${
                      activeSubCategory === child.slug
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border bg-background text-foreground hover:border-primary/30"
                    }`}
                  >
                    {child.name}
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="space-y-2 rounded-2xl border border-border/60 bg-gradient-to-b from-white to-muted/20 p-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground/75">Sort by</p>
            <div className="grid grid-cols-1 gap-2">
              {[
                { value: "newest", label: "Newest" },
                { value: "price-asc", label: "Price: Low to High" },
                { value: "price-desc", label: "Price: High to Low" },
                { value: "name", label: "Name: A to Z" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => pushParams((params) => params.set("sort", option.value))}
                  className={`rounded-xl border px-4 py-2.5 text-left text-sm transition-all ${
                    activeSort === option.value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-background text-foreground hover:border-primary/30"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-2 rounded-2xl border border-border/60 bg-gradient-to-b from-white to-muted/20 p-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground/75">Price range</p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                inputMode="numeric"
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
                placeholder="Min"
                className="h-10 rounded-xl"
              />
              <Input
                type="number"
                inputMode="numeric"
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                placeholder="Max"
                className="h-10 rounded-xl"
              />
            </div>
            <Button
              onClick={() =>
                pushParams((params) => {
                  if (minPrice) params.set("min", minPrice)
                  else params.delete("min")

                  if (maxPrice) params.set("max", maxPrice)
                  else params.delete("max")
                })
              }
              className="h-10 w-full rounded-full bg-primary text-[11px] font-bold uppercase tracking-[0.18em] text-white hover:bg-foreground"
            >
              Apply
            </Button>
          </section>
        </div>
      </div>
    </div>
  )
}
