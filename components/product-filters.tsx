"use client"

import { useMemo, useState, useTransition } from "react"
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
  isCollapsed,
  onCollapsedChange,
}: {
  categories: FilterCategory[]
  basePath?: string
  scrollTargetId?: string
  isCollapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [minPrice, setMinPrice] = useState(searchParams.get("min") || "")
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max") || "")
  const [localCollapsed, setLocalCollapsed] = useState(false)

  const collapsed = isCollapsed ?? localCollapsed
  const setCollapsed = onCollapsedChange ?? setLocalCollapsed

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
    startTransition(() => {
      router.replace(query ? `${basePath}?${query}` : basePath, { scroll: false })
    })
  }

  const clearAll = () => {
    setMinPrice("")
    setMaxPrice("")
    startTransition(() => {
      router.replace(basePath, { scroll: false })
    })
  }

  return (
    <div className={`overflow-hidden rounded-[24px] border border-border/60 bg-white shadow-[0_16px_34px_rgba(0,0,0,0.06)] ${collapsed ? "w-[72px]" : "w-full max-w-[276px]"}`}>
      <div className={`border-b border-border/50 transition-all duration-300 ${collapsed ? "p-2" : "bg-gradient-to-r from-primary/8 to-transparent p-3"}`}>
        <div className={`flex items-center transition-all duration-300 ${collapsed ? "flex-col gap-2" : "justify-between gap-3"}`}>
          <div className={`inline-flex items-center gap-2 rounded-full bg-primary/8 font-bold uppercase tracking-[0.24em] text-primary transition-all duration-300 ${collapsed ? "px-2 py-2 text-[8px] [writing-mode:vertical-rl] rotate-180 rounded-full" : "px-3 py-1 text-[9px]"}`}>
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {!collapsed && "Filters"}
          </div>
          <Button
            variant="ghost"
            onClick={() => setCollapsed(!collapsed)}
            className={`text-[11px] font-semibold text-muted-foreground hover:text-primary transition-all duration-300 ${collapsed ? "h-9 w-9 rounded-full px-0" : "h-7 px-2.5"}`}
            aria-label={collapsed ? "Show filters" : "Hide filters"}
            aria-busy={isPending}
          >
            {collapsed ? "<" : ">"}
          </Button>
        </div>

        {!collapsed && (
          <div className="mt-2 flex items-center justify-between gap-2">
            <Button variant="ghost" onClick={clearAll} className="h-7 px-2.5 text-[10px] text-muted-foreground hover:text-primary">
              Clear
            </Button>
            <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70">
              Narrow and quick
            </span>
          </div>
        )}
      </div>

      <div className={`overflow-hidden ${collapsed ? "hidden" : "block"}`}>
        <div className="space-y-3 overflow-y-auto overscroll-contain px-3 py-3 pr-2 md:max-h-[calc(100vh-10rem)]">
          {(activeCategory || activeSubCategory || minPrice || maxPrice || activeSort !== "newest") && (
            <div className="flex flex-wrap gap-1.5">
              {activeCategory && (
                <button
                  type="button"
                  onClick={() =>
                    pushParams((params) => {
                      params.delete("category")
                      params.delete("sub")
                    })
                  }
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-primary"
                >
                  {selectedCategory?.name || activeCategory}
                  <X className="h-3 w-3" />
                </button>
              )}
              {activeSubCategory && (
                <button
                  type="button"
                  onClick={() => pushParams((params) => params.delete("sub"))}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-primary"
                >
                  {selectedCategory?.children?.find((child) => child.slug === activeSubCategory)?.name || activeSubCategory}
                  <X className="h-3 w-3" />
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
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-primary"
                >
                  Price range
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          )}

          <section className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-foreground/75">Category</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() =>
                  pushParams((params) => {
                    params.delete("category")
                    params.delete("sub")
                  })
                }
                className={`rounded-full px-3 py-1.5 text-[11px] transition-all ${
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
                className={`rounded-full px-3 py-1.5 text-[11px] transition-all ${
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
            <section className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-foreground/75">Subcategory</p>
              <div className="grid grid-cols-1 gap-1.5">
                {selectedCategory.children.map((child) => (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => pushParams((params) => params.set("sub", child.slug))}
                    className={`rounded-xl border px-3 py-2 text-left text-[11px] transition-all ${
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

          <section className="space-y-1.5 rounded-2xl border border-border/60 bg-gradient-to-b from-white to-muted/20 p-2.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-foreground/75">Sort by</p>
            <div className="grid grid-cols-1 gap-1.5">
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
                  className={`rounded-xl border px-3 py-2 text-left text-[11px] transition-all ${
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

          <section className="space-y-1.5 rounded-2xl border border-border/60 bg-gradient-to-b from-white to-muted/20 p-2.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-foreground/75">Price range</p>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                inputMode="numeric"
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
                placeholder="Min"
                className="h-9 rounded-xl text-[11px]"
              />
              <Input
                type="number"
                inputMode="numeric"
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                placeholder="Max"
                className="h-9 rounded-xl text-[11px]"
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
              className="h-9 w-full rounded-full bg-primary text-[10px] font-bold uppercase tracking-[0.16em] text-white hover:bg-foreground"
            >
              Apply
            </Button>
          </section>
        </div>
      </div>
    </div>
  )
}
