'use client'

import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Upload, X, FolderOpen } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"

interface CategoryImageUploadProps {
  imageUrl: string
  onImageChange: (url: string) => void
  categoryName: string
}

export function CategoryImageUpload({ imageUrl, onImageChange, categoryName }: CategoryImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'category')
      formData.append('name', categoryName)

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload image')
      }

      const data = await response.json()
      onImageChange(data.url)
      toast.success('Image uploaded successfully!')
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = () => {
    onImageChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-3">
      <Label>Category Image</Label>
      
      {/* Image Preview */}
      {imageUrl ? (
        <div className="relative w-48 h-32 rounded-lg overflow-hidden bg-muted border group">
          <Image
            src={imageUrl}
            alt="Category image"
            fill
            className="object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
          {/* Remove button */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="destructive"
              onClick={handleRemoveImage}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          {/* Fallback for broken images */}
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <FolderOpen className="h-12 w-12" />
          </div>
        </div>
      ) : (
        <div className="w-48 h-32 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/30">
          <div className="text-center">
            <FolderOpen className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No image selected</p>
          </div>
        </div>
      )}

      {/* Upload Controls */}
      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex-1"
        >
          <Upload className="mr-2 h-4 w-4" />
          {isUploading ? 'Uploading...' : imageUrl ? 'Change Image' : 'Upload Image'}
        </Button>
        {imageUrl && (
          <Button
            type="button"
            variant="ghost"
            onClick={handleRemoveImage}
            className="px-3"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <p className="text-xs text-muted-foreground">
        Supported formats: JPG, PNG, GIF. Max size: 5MB
      </p>
    </div>
  )
}