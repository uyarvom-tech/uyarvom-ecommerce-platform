'use client'

import { useState } from 'react'
import Image from "next/image"
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

interface ProductImage {
  id?: string
  imageUrl: string
  altText: string
  isPrimary: boolean
  sortOrder?: number
}

interface ImageUploadProps {
  images: ProductImage[]
  onImagesChange: (images: ProductImage[]) => void
  productId?: string
}

export function ImageUpload({ images, onImagesChange, productId }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = async (file: File) => {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 25 * 1024 * 1024) {
      toast.error('Image size must be less than 25MB')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const uploadResponse = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image')
      }

      const uploadResult = await uploadResponse.json()
      const altText = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ')

      if (productId) {
        const saveResponse = await fetch(`/api/admin/products/${productId}/images`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl: uploadResult.url,
            altText,
            isPrimary: images.length === 0
          })
        })

        if (!saveResponse.ok) {
          throw new Error('Failed to save image to product')
        }

        const refreshResponse = await fetch(`/api/admin/products/${productId}`)
        if (refreshResponse.ok) {
          const productData = await refreshResponse.json()
          onImagesChange(productData.images || [])
        }
      } else {
        onImagesChange([
          ...images,
          {
            imageUrl: uploadResult.url,
            altText,
            isPrimary: images.length === 0,
            sortOrder: images.length
          }
        ])
      }

      toast.success('Image uploaded successfully!')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    if (images[index].isPrimary && newImages.length > 0) {
      newImages[0].isPrimary = true
    }
    onImagesChange(newImages)
  }

  const setPrimaryImage = (index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      isPrimary: i === index
    }))
    onImagesChange(newImages)
  }

  const updateAltText = (index: number, altText: string) => {
    const newImages = images.map((img, i) =>
      i === index ? { ...img, altText } : img
    )
    onImagesChange(newImages)
  }

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed rounded-lg p-6 text-center">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFileUpload(file)
          }}
          disabled={uploading}
          className="hidden"
          id="image-upload"
        />
        <label htmlFor="image-upload" className="cursor-pointer">
          <div className="flex flex-col items-center">
            {uploading ? (
              <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mb-4" />
            ) : (
              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            )}
            <p className="text-lg font-medium mb-2">
              {uploading ? 'Uploading...' : 'Upload Product Image'}
            </p>
            <p className="text-sm text-muted-foreground">
              Click to select an image file (max 25MB)
            </p>
          </div>
        </label>
      </div>

      {images.map((image, index) => (
        <div key={index} className="border rounded-lg p-4">
          <div className="flex gap-4">
            <div className="w-24 h-24 border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center flex-shrink-0">
              {image.imageUrl ? (
                <Image
                  src={image.imageUrl}
                  alt={image.altText || 'Product image'}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon className="h-8 w-8 text-gray-400" />
              )}
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <Label>Alt Text</Label>
                <Input
                  value={image.altText}
                  onChange={(e) => updateAltText(index, e.target.value)}
                  placeholder="Describe the image"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`primary-${index}`}
                    checked={image.isPrimary}
                    onCheckedChange={() => setPrimaryImage(index)}
                  />
                  <Label htmlFor={`primary-${index}`}>Primary Image</Label>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeImage(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
                {image.imageUrl}
              </div>
            </div>
          </div>
        </div>
      ))}

      {images.length === 0 && (
        <div className="text-center py-4 text-muted-foreground">
          <p>No images uploaded yet</p>
        </div>
      )}
    </div>
  )
}
