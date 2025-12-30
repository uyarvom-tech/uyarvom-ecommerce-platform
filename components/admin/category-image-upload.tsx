'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"

interface CategoryImageUploadProps {
  imageUrl: string
  onImageChange: (imageUrl: string) => void
  categoryName?: string
}

export function CategoryImageUpload({ imageUrl, onImageChange, categoryName }: CategoryImageUploadProps) {
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = async (file: File) => {
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, etc.)')
      return
    }

    // Validate file size (max 10MB for category images)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB')
      return
    }

    setUploading(true)

    try {
      // Upload the file
      const formData = new FormData()
      formData.append('file', file)

      const uploadResponse = await fetch('/api/admin/upload/category', {
        method: 'POST',
        body: formData
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image')
      }

      const uploadResult = await uploadResponse.json()
      
      // Update the image URL
      onImageChange(uploadResult.url)
      
      toast.success('Category image uploaded successfully!')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = () => {
    onImageChange('')
    toast.success('Image removed')
  }

  return (
    <div className="space-y-4">
      <Label>Category Image</Label>
      
      {imageUrl ? (
        // Show existing image with remove option
        <div className="relative">
          <div className="relative w-full h-48 border rounded-lg overflow-hidden bg-gray-50">
            <Image
              src={imageUrl}
              alt={categoryName || 'Category image'}
              fill
              className="object-cover"
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={removeImage}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="mt-2 text-xs text-muted-foreground bg-gray-50 p-2 rounded">
            {imageUrl}
          </div>
        </div>
      ) : (
        // Show upload area
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
            id="category-image-upload"
          />
          <label htmlFor="category-image-upload" className="cursor-pointer">
            <div className="flex flex-col items-center">
              {uploading ? (
                <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mb-4" />
              ) : (
                <Upload className="h-12 w-12 text-muted-foreground mb-4" />
              )}
              <p className="text-lg font-medium mb-2">
                {uploading ? 'Uploading...' : 'Upload Category Image'}
              </p>
              <p className="text-sm text-muted-foreground">
                Click to select PNG, JPG, or other image file (max 10MB)
              </p>
            </div>
          </label>
        </div>
      )}
    </div>
  )
}