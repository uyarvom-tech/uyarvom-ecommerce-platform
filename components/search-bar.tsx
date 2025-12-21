"use client"

import type React from "react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, X } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"

interface Category {
  id: string
  name: string
  slug: string
}

export function SearchBar({
  initialQuery,
  categories,
  selectedCategory,
}: {
  initialQuery: string
  categories: Category[]
  selectedCategory?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(initialQuery)
  const [category, setCategory] = useState(selectedCategory || "all")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query) params.set("q", query)
    if (category && category !== "all") params.set("category", category)
    router.push(`/search?${params.toString()}`)
  }

  const clearSearch = () => {
    setQuery("")
    setCategory("all")
    router.push("/search")
  }

  return (
    <form onSubmit={handleSearch} className="mx-auto max-w-3xl">
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search for cookware, bakeware, tools..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-14 bg-background pl-12 pr-12 text-base shadow-sm"
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-14 bg-background shadow-sm md:w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.slug}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button type="submit" size="lg" className="h-14 px-8">
          Search
        </Button>
      </div>

      {(query || (category && category !== "all")) && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <p className="text-sm text-muted-foreground">
            Showing results
            {query && ` for "${query}"`}
            {category && category !== "all" && ` in ${categories.find((c) => c.slug === category)?.name}`}
          </p>
          <Button type="button" variant="link" size="sm" onClick={clearSearch} className="h-auto p-0">
            Clear filters
          </Button>
        </div>
      )}
    </form>
  )
}
