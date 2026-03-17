'use client'

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileText, Package, Search, Tag, X } from "lucide-react"

interface Suggestion {
  text: string
  type: "product" | "category" | "page"
  href: string
}

export function ProductsSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get("search") || "")
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const updateDropdownPosition = () => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    setDropdownPosition({
      top: rect.bottom + window.scrollY + 8,
      left: rect.left + window.scrollX,
      width: rect.width,
    })
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        fetchSuggestions(query)
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    if (!showSuggestions) return

    updateDropdownPosition()
    window.addEventListener("resize", updateDropdownPosition)
    window.addEventListener("scroll", updateDropdownPosition)
    return () => {
      window.removeEventListener("resize", updateDropdownPosition)
      window.removeEventListener("scroll", updateDropdownPosition)
    }
  }, [showSuggestions])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !containerRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchSuggestions = async (searchQuery: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/products/suggestions?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      setSuggestions(data.suggestions || [])
      setShowSuggestions(Boolean(data.suggestions?.length))
    } catch (error) {
      console.error("Error fetching suggestions:", error)
      setSuggestions([])
      setShowSuggestions(false)
    } finally {
      setIsLoading(false)
    }
  }

  const runTextSearch = (value?: string) => {
    const queryToSearch = (value || query).trim()
    if (!queryToSearch) return

    const params = new URLSearchParams(searchParams.toString())
    params.set("search", queryToSearch)
    router.push(`/?${params.toString()}`)
    setShowSuggestions(false)
    inputRef.current?.blur()
  }

  const goToSuggestion = (suggestion: Suggestion) => {
    setQuery(suggestion.text)
    setShowSuggestions(false)
    router.push(suggestion.href)
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      goToSuggestion(suggestions[selectedIndex])
      return
    }
    runTextSearch()
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault()
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
        break
      case "ArrowUp":
        event.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case "Escape":
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  const clearSearch = () => {
    setQuery("")
    setSuggestions([])
    setShowSuggestions(false)
    const params = new URLSearchParams(searchParams.toString())
    params.delete("search")
    router.push(params.toString() ? `/?${params.toString()}` : "/")
  }

  const getSuggestionIcon = (type: Suggestion["type"]) => {
    if (type === "product") return <Package className="h-4 w-4" />
    if (type === "category") return <Tag className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  const SuggestionsDropdown = () => {
    if (!showSuggestions || typeof window === "undefined") return null

    return createPortal(
      <div>
        {suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            style={{
              position: "absolute",
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              zIndex: 99999,
            }}
            className="overflow-hidden rounded-[26px] border border-border bg-white shadow-2xl"
          >
            <div className="border-b border-border/10 px-5 py-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Search the whole app</span>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.type}-${suggestion.text}`}
                  type="button"
                  onClick={() => goToSuggestion(suggestion)}
                  className={`flex w-full items-center gap-4 px-5 py-4 text-left transition-colors ${
                    index === selectedIndex ? "bg-secondary" : "hover:bg-secondary"
                  }`}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-primary">
                    {getSuggestionIcon(suggestion.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{suggestion.text}</p>
                    <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">{suggestion.type}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {isLoading && query.length >= 2 && (
          <div
            style={{
              position: "absolute",
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              zIndex: 99999,
            }}
            className="rounded-[26px] border border-border bg-white p-5 shadow-xl"
          >
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Searching products, categories, and pages...
            </div>
          </div>
        )}
      </div>,
      document.body
    )
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit}>
        <div className="relative flex items-center rounded-full border border-primary/15 bg-white p-1 shadow-[0_8px_22px_rgba(17,17,17,0.05)] transition-all duration-300 focus-within:border-primary/35 focus-within:shadow-[0_14px_34px_rgba(156,124,56,0.14)]">
          <div className="ml-2 flex h-9 w-9 items-center justify-center text-primary">
            <Search className="h-4 w-4" />
          </div>
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search products, categories, pages, or support"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true)
            }}
            className="h-11 border-0 bg-transparent pl-2 pr-14 text-sm shadow-none focus-visible:ring-0"
            autoComplete="off"
          />
          <div className="absolute right-1 flex items-center">
            {query && (
              <Button type="button" variant="ghost" size="icon" onClick={clearSearch} className="h-9 w-9 rounded-full">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </form>

      <SuggestionsDropdown />
    </div>
  )
}
