'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, X, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  displayOrder: number
  isActive: boolean
}

interface CategoryEditFormProps {
  category: Category
  type: 'main' | 'sub'
  parentId?: string
}

export function CategoryEditForm({ category, type, parentId }: CategoryEditFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState(category.name)
  const [description, setDescription] = useState(category.description || '')
  const [imageUrl, setImageUrl] = useState(category.imageUrl || '')
  const [displayOrder, setDisplayOrder] = useState(category.displayOrder)
  const [isActive, setIsActive] = useState(category.isActive)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('File must be an image')
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'categories')

    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || `Upload failed (${res.status})`)
      }
      setImageUrl(data.url)
      toast.success('Image uploaded')
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload image')
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch(`/api/admin/categories/${category.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, imageUrl: imageUrl || null, displayOrder, isActive }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update')
      }

      toast.success('Category updated successfully')
      router.push(parentId ? `/admin/catalog/${parentId}` : '/admin/catalog')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update category')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Button variant="outline" size="sm" asChild>
        <Link href={parentId ? `/admin/catalog/${parentId}` : '/admin/catalog'}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{type === 'main' ? 'Category' : 'Sub-Category'} Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="displayOrder">Display Order</Label>
              <Input id="displayOrder" type="number" value={displayOrder} onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)} />
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4" />
                <span className="text-sm font-medium">Active</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Category Image</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {imageUrl && (
            <div className="relative w-full h-48 rounded-lg overflow-hidden border bg-muted">
              <Image src={imageUrl} alt={name} fill className="object-cover" />
              <Button type="button" variant="destructive" size="sm" className="absolute top-2 right-2" onClick={() => setImageUrl('')}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? 'Uploading...' : imageUrl ? 'Change Image' : 'Upload Image'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Saving...' : 'Save Changes'}
      </Button>
    </form>
  )
}
