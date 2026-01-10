'use client'

import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Loader2, 
  GripVertical,
  Star,
  StarOff,
  Plus
} from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"

interface ProductImage {
  id?: string
  imageUrl: string
  altText: string
  isPrimary: boolean
  sortOrder?: number
}

interface MultiImageManagerProps {
  images: ProductImage[]
  onImagesChange: (images: ProductImage[]) => void
  productId?: string
  maxImages?: number
}

export function MultiImageManager({ 
  images, 
  onImagesChange, 
  productId, 
  maxImages = 10 
}: MultiImageManagerProps) {
  const [uploading, setUploading] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (files: FileList) => {
    if (!files || files.length === 0) return

    // Check if adding these files would exceed max images
    if (images.length + files.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed. You can add ${maxImages - images.length} more.`)
      return
    }

    setUploading(true)

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} is not an image file`)
        }

        // Validate file size (max 25MB)
        if (file.size > 25 * 1024 * 1024) {
          throw new Error(`${file.name} is too large (max 25MB)`)
        }

        // Upload the file
        const formData = new FormData()
        formData.append('file', file)

        const uploadResponse = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData
        })

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }

        const uploadResult = await uploadResponse.json()
        
        return {
          imageUrl: uploadResult.url,
          altText: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' '),
          isPrimary: false,
          sortOrder: images.length + Array.from(files).indexOf(file)
        }
      })

      const newImages = await Promise.all(uploadPromises)
      
      // If editing existing product, add images via API
      if (productId) {
        try {
          const addPromises = newImages.map(async (newImage) => {
            const response = await fetch(`/api/admin/products/${productId}/images`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                imageUrl: newImage.imageUrl,
                altText: newImage.altText,
                isPrimary: images.length === 0 && newImages.indexOf(newImage) === 0
              })
            })

            if (!response.ok) {
              const errorData = await response.json()
              throw new Error(errorData.error || 'Failed to add image to product')
            }

            return await response.json()
          })

          await Promise.all(addPromises)
          
          // Refresh images from database
          const refreshResponse = await fetch(`/api/admin/products/${productId}`)
          if (refreshResponse.ok) {
            const productData = await refreshResponse.json()
            onImagesChange(productData.images || [])
          }

          toast.success(`${newImages.length} image(s) added to product!`)
        } catch (error: any) {
          console.error('Add images to product error:', error)
          toast.error(error.message || 'Failed to add images to product')
        }
      } else {
        // For new products, add to local state
        // If no primary image exists, make the first uploaded image primary
        if (images.length === 0 && newImages.length > 0) {
          newImages[0].isPrimary = true
        }

        const updatedImages = [...images, ...newImages].map((img, index) => ({
          ...img,
          sortOrder: index
        }))

        onImagesChange(updatedImages)
        toast.success(`${newImages.length} image(s) uploaded successfully!`)
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Failed to upload images')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = async (index: number) => {
    const imageToRemove = images[index]
    
    // If editing existing product and image has an ID, delete from database
    if (productId && imageToRemove.id) {
      try {
        const response = await fetch(`/api/admin/products/${productId}/images/${imageToRemove.id}`, {
          method: 'DELETE'
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to delete image')
        }

        // Remove from local state
        const newImages = images.filter((_, i) => i !== index)
        
        // If we removed the primary image, make the first remaining image primary
        if (imageToRemove.isPrimary && newImages.length > 0) {
          newImages[0].isPrimary = true
        }
        
        // Update sort orders
        const reorderedImages = newImages.map((img, i) => ({
          ...img,
          sortOrder: i
        }))
        
        onImagesChange(reorderedImages)
        toast.success('Image deleted from product')
      } catch (error: any) {
        console.error('Delete image error:', error)
        toast.error(error.message || 'Failed to delete image')
      }
    } else {
      // For new products or images without IDs, just remove from local state
      const newImages = images.filter((_, i) => i !== index)
      if (imageToRemove.isPrimary && newImages.length > 0) {
        newImages[0].isPrimary = true
      }
      
      // Update sort orders
      const reorderedImages = newImages.map((img, i) => ({
        ...img,
        sortOrder: i
      }))
      
      onImagesChange(reorderedImages)
      toast.success('Image removed')
    }
  }

  const setPrimaryImage = async (index: number) => {
    const imageToUpdate = images[index]
    
    // If editing existing product and image has an ID, update in database
    if (productId && imageToUpdate.id) {
      try {
        const response = await fetch(`/api/admin/products/${productId}/images/${imageToUpdate.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPrimary: true })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update primary image')
        }

        // Update local state
        const newImages = images.map((img, i) => ({
          ...img,
          isPrimary: i === index
        }))
        onImagesChange(newImages)
        toast.success('Primary image updated')
      } catch (error: any) {
        console.error('Update primary image error:', error)
        toast.error(error.message || 'Failed to update primary image')
      }
    } else {
      // For new products or images without IDs, just update local state
      const newImages = images.map((img, i) => ({
        ...img,
        isPrimary: i === index
      }))
      onImagesChange(newImages)
      toast.success('Primary image updated')
    }
  }

  const updateAltText = async (index: number, altText: string) => {
    const imageToUpdate = images[index]
    
    // If editing existing product and image has an ID, update in database
    if (productId && imageToUpdate.id) {
      try {
        const response = await fetch(`/api/admin/products/${productId}/images/${imageToUpdate.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ altText })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update alt text')
        }

        // Update local state
        const newImages = images.map((img, i) => 
          i === index ? { ...img, altText } : img
        )
        onImagesChange(newImages)
      } catch (error: any) {
        console.error('Update alt text error:', error)
        toast.error(error.message || 'Failed to update alt text')
      }
    } else {
      // For new products or images without IDs, just update local state
      const newImages = images.map((img, i) => 
        i === index ? { ...img, altText } : img
      )
      onImagesChange(newImages)
    }
  }

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      return
    }

    const newImages = [...images]
    const draggedImage = newImages[draggedIndex]
    
    // Remove dragged image from its current position
    newImages.splice(draggedIndex, 1)
    
    // Insert at new position
    newImages.splice(dropIndex, 0, draggedImage)
    
    // Update sort orders
    const reorderedImages = newImages.map((img, i) => ({
      ...img,
      sortOrder: i
    }))
    
    // If editing existing product, save reorder to database
    if (productId) {
      try {
        const response = await fetch(`/api/admin/products/${productId}/images`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ images: reorderedImages })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to reorder images')
        }

        onImagesChange(reorderedImages)
        setDraggedIndex(null)
        toast.success('Images reordered')
      } catch (error: any) {
        console.error('Reorder images error:', error)
        toast.error(error.message || 'Failed to reorder images')
        setDraggedIndex(null)
      }
    } else {
      // For new products, just update local state
      onImagesChange(reorderedImages)
      setDraggedIndex(null)
      toast.success('Images reordered')
    }
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div className="border-2 border-dashed rounded-lg p-6 text-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            if (e.target.files) handleFileUpload(e.target.files)
          }}
          disabled={uploading}
          className="hidden"
        />
        
        <div className="flex flex-col items-center">
          {uploading ? (
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mb-4" />
          ) : (
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
          )}
          <p className="text-lg font-medium mb-2">
            {uploading ? 'Uploading...' : 'Upload Product Images'}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Select multiple images (max {maxImages}, 25MB each)
          </p>
          <Button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || images.length >= maxImages}
          >
            <Plus className="mr-2 h-4 w-4" />
            {images.length === 0 ? 'Add Images' : 'Add More Images'}
          </Button>
          {images.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              {images.length} of {maxImages} images uploaded
            </p>
          )}
        </div>
      </div>

      {/* Images Grid */}
      {images.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Product Images</h3>
            <Badge variant="outline">
              {images.length} image{images.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          
          <div className="text-sm text-muted-foreground bg-blue-50 border border-blue-200 rounded-lg p-3">
            💡 <strong>Tips:</strong> Drag images to reorder them. The first image will be the main product image. 
            Click the star to set a different primary image.
          </div>

          <div className="grid gap-4">
            {images.map((image, index) => (
              <div
                key={`${image.imageUrl}-${index}`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`
                  border rounded-lg p-4 transition-all cursor-move
                  ${draggedIndex === index ? 'opacity-50 scale-95' : 'hover:shadow-md'}
                  ${image.isPrimary ? 'border-primary bg-primary/5' : 'border-border'}
                `}
              >
                <div className="flex gap-4">
                  {/* Drag Handle */}
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <GripVertical className="h-5 w-5" />
                    <span className="text-xs font-medium mt-1">#{index + 1}</span>
                  </div>

                  {/* Image Preview */}
                  <div className="relative w-24 h-24 border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center flex-shrink-0">
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
                    
                    {/* Primary Badge */}
                    {image.isPrimary && (
                      <div className="absolute top-1 left-1">
                        <Badge className="text-xs px-1 py-0.5 bg-primary">
                          PRIMARY
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Image Details */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <Label className="text-sm">Alt Text</Label>
                      <Input
                        value={image.altText}
                        onChange={(e) => updateAltText(index, e.target.value)}
                        placeholder="Describe the image"
                        className="mt-1"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Button
                        type="button"
                        variant={image.isPrimary ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPrimaryImage(index)}
                        className="flex items-center gap-2"
                      >
                        {image.isPrimary ? (
                          <Star className="h-4 w-4 fill-current" />
                        ) : (
                          <StarOff className="h-4 w-4" />
                        )}
                        {image.isPrimary ? 'Primary' : 'Set Primary'}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeImage(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                        Remove
                      </Button>
                    </div>

                    <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded truncate">
                      {image.imageUrl}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {images.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No images uploaded yet</p>
          <p className="text-sm">Upload your first product image to get started</p>
        </div>
      )}
    </div>
  )
}