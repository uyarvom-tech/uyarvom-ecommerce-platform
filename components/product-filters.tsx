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
}: {
  categories: FilterCategory[]
  basePath?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [minPrice, setMinPrice] = useState(searchParams.get("min") || "")
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max") || "")

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
    router.push(query ? `${basePath}?${query}` : basePath)
  }

  const clearAll = () => {
    setMinPrice("")
    setMaxPrice("")
    router.push(basePath)
  }

  return (
    <div className="rounded-[24px] border border-border/50 bg-white/96 p-4 shadow-sm md:p-4.5">
      <div className="space-y-5 overflow-y-auto overscroll-contain pr-1 md:max-h-[calc(100vh-14rem)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/6 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-primary">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
            </div>
            <h3 className="mt-3 text-lg font-serif text-foreground">Shop smarter</h3>
          </div>
          <Button variant="ghost" onClick={clearAll} className="h-auto p-0 text-[11px] text-muted-foreground hover:text-primary">
            Clear all
          </Button>
        </div>

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

        <section className="space-y-3">
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
          <section className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground/75">Subcategory</p>
            <div className="grid grid-cols-1 gap-2">
              {selectedCategory.children.map((child) => (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => pushParams((params) => params.set("sub", child.slug))}
                  className={`rounded-2xl border px-4 py-2.5 text-left text-sm transition-all ${
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

        <section className="space-y-3">
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
                className={`rounded-2xl border px-4 py-2.5 text-left text-sm transition-all ${
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

        <section className="space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground/75">Price range</p>
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              inputMode="numeric"
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
              placeholder="Min"
              className="h-10 rounded-2xl"
            />
            <Input
              type="number"
              inputMode="numeric"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              placeholder="Max"
              className="h-10 rounded-2xl"
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
            className="h-10 w-full rounded-2xl bg-primary text-[11px] font-bold uppercase tracking-[0.18em] text-white hover:bg-foreground"
          >
            Apply price filter
          </Button>
        </section>
      </div>
    </div>
  )
}
