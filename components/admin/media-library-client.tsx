'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Grid3X3, List, ExternalLink, Copy, Check } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'

interface MediaImage {
  id: string
  imageUrl: string
  altText: string | null
  isPrimary: boolean
  sortOrder: number
  createdAt: string | Date
  productId: string
  productName: string
  productSlug: string
  productSku: string | null
  colorName: string | null
}

interface MediaLibraryClientProps {
  images: MediaImage[]
}

export function MediaLibraryClient({ images }: MediaLibraryClientProps) {
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterType, setFilterType] = useState<'all' | 'primary' | 'ai-generated'>('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const filteredImages = useMemo(() => {
    let result = images

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (img) =>
          img.productName.toLowerCase().includes(q) ||
          img.altText?.toLowerCase().includes(q) ||
          img.productSku?.toLowerCase().includes(q) ||
          img.colorName?.toLowerCase().includes(q)
      )
    }

    if (filterType === 'primary') {
      result = result.filter((img) => img.isPrimary)
    } else if (filterType === 'ai-generated') {
      result = result.filter((img) => img.imageUrl.includes('ai-gen') || img.altText?.includes('AI generated'))
    }

    return result
  }, [images, search, filterType])

  const copyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    toast.success('Image URL copied')
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by product name, SKU, color..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-3">
          <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Images</SelectItem>
              <SelectItem value="primary">Primary Only</SelectItem>
              <SelectItem value="ai-generated">AI Generated</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredImages.length} of {images.length} images
      </p>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filteredImages.map((img) => (
            <Card key={img.id} className="group overflow-hidden">
              <div className="relative aspect-square bg-muted">
                <Image
                  src={img.imageUrl}
                  alt={img.altText || img.productName}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                />
                {img.isPrimary && (
                  <Badge className="absolute top-1 left-1 text-[10px] px-1 py-0">Primary</Badge>
                )}
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => copyUrl(img.imageUrl, img.id)}
                  >
                    {copiedId === img.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                  <Button size="sm" variant="secondary" asChild>
                    <Link href={`/admin/products/${img.productId}/edit`}>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </div>
              <CardContent className="p-2">
                <p className="text-xs font-medium truncate">{img.productName}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {img.colorName || 'Default'} • {img.productSku || 'No SKU'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-2">
          {filteredImages.map((img) => (
            <div
              key={img.id}
              className="flex items-center gap-4 rounded-lg border p-3 hover:bg-muted/30 transition-colors"
            >
              <div className="relative h-14 w-14 flex-shrink-0 rounded overflow-hidden bg-muted">
                <Image
                  src={img.imageUrl}
                  alt={img.altText || img.productName}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{img.productName}</p>
                <p className="text-xs text-muted-foreground">
                  {img.colorName || 'Default'} • {img.productSku || 'No SKU'}
                  {img.isPrimary && ' • Primary'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyUrl(img.imageUrl, img.id)}
                  title="Copy URL"
                >
                  {copiedId === img.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="ghost" asChild title="Edit Product">
                  <Link href={`/admin/products/${img.productId}/edit`}>
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredImages.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">No images found</p>
          <p className="text-sm">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  )
}
