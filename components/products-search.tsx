'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createPortal } from 'react-dom'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X, Package, Tag } from "lucide-react"

interface Suggestion {
  text: string
  type: 'product' | 'category'
}

export function ProductsSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('search') || '')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Calculate dropdown position
  const updateDropdownPosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width - 60 // Account for search button width
      })
    }
  }

  // Debounced search for suggestions
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        fetchSuggestions(query)
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Update position when showing suggestions
  useEffect(() => {
    if (showSuggestions) {
      updateDropdownPosition()
      window.addEventListener('resize', updateDropdownPosition)
      window.addEventListener('scroll', updateDropdownPosition)
      return () => {
        window.removeEventListener('resize', updateDropdownPosition)
        window.removeEventListener('scroll', updateDropdownPosition)
      }
    }
  }, [showSuggestions])

  const fetchSuggestions = async (searchQuery: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/products/suggestions?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      setSuggestions(data.suggestions || [])
      setShowSuggestions(data.suggestions?.length > 0)
    } catch (error) {
      console.error('Error fetching suggestions:', error)
      setSuggestions([])
      setShowSuggestions(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (searchQuery?: string) => {
    const queryToSearch = searchQuery || query
    if (!queryToSearch.trim()) return

    const params = new URLSearchParams(searchParams.toString())
    params.set('search', queryToSearch.trim())
    router.push(`/?${params.toString()}`)
    setShowSuggestions(false)
    inputRef.current?.blur()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      handleSearch(suggestions[selectedIndex].text)
    } else {
      handleSearch()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  const clearSearch = () => {
    setQuery('')
    setSuggestions([])
    setShowSuggestions(false)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('search')
    router.push(`/?${params.toString()}`)
  }

  const selectSuggestion = (suggestion: Suggestion) => {
    setQuery(suggestion.text)
    handleSearch(suggestion.text)
  }

  // Close suggestions when clicking outside
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

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const SuggestionsDropdown = () => {
    if (!showSuggestions || typeof window === 'undefined') return null

    return createPortal(
      <div>
        {/* Suggestions Dropdown */}
        {suggestions.length > 0 && (
          <div 
            ref={suggestionsRef}
            style={{
              position: 'absolute',
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              zIndex: 99999
            }}
            className="bg-background border border-border rounded-lg shadow-xl max-h-64 overflow-y-auto"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.type}-${suggestion.text}`}
                type="button"
                onClick={() => selectSuggestion(suggestion)}
                className={`w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3 ${
                  index === selectedIndex ? 'bg-muted' : ''
                }`}
              >
                {suggestion.type === 'product' ? (
                  <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                ) : (
                  <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
                <span className="flex-1 text-sm">{suggestion.text}</span>
                <span className="text-xs text-muted-foreground capitalize">
                  {suggestion.type}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && query.length >= 2 && (
          <div 
            style={{
              position: 'absolute',
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              zIndex: 99999
            }}
            className="bg-background border border-border rounded-lg shadow-xl p-4"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
              Searching...
            </div>
          </div>
        )}
      </div>,
      document.body
    )
  }

  return (
    <div ref={containerRef} className="relative max-w-md mx-auto">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0) {
                  setShowSuggestions(true)
                }
              }}
              className="h-12 pl-10 pr-10 rounded-full border-2 border-primary/20 focus:border-primary bg-background text-foreground transition-colors"
              autoComplete="off"
            />
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={clearSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 hover:bg-muted rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button 
            type="submit" 
            className="h-12 rounded-full px-6"
            disabled={!query.trim()}
          >
            Search
          </Button>
        </div>
      </form>

      <SuggestionsDropdown />
    </div>
  )
}