'use client'

import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"

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
}

export function ImageUpload({ images, onImagesChange }: ImageUploadProps) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({})

  console.log('🖼️ ImageUpload rendered with images:', images)

  const addImage = () => {
    console.log('➕ Adding new image slot')
    const newImages = [...images, {
      imageUrl: '',
      altText: '',
      isPrimary: images.length === 0, // First image is automatically primary
      sortOrder: images.length
    }]
    console.log('📝 New images array:', newImages)
    onImagesChange(newImages)
  }

  const updateImage = (index: number, field: keyof ProductImage, value: any) => {
    console.log(`🔄 Updating image ${index}, field: ${field}, value:`, value)
    const newImages = images.map((img, i) => 
      i === index ? { ...img, [field]: value } : img
    )
    console.log('📝 Updated images array:', newImages)
    onImagesChange(newImages)
  }

  const removeImage = (index: number) => {
    console.log(`🗑️ Removing image at index ${index}`)
    const newImages = images.filter((_, i) => i !== index)
    // If we removed the primary image, make the first one primary
    if (images[index].isPrimary && newImages.length > 0) {
      newImages[0].isPrimary = true
    }
    // Update sort orders
    newImages.forEach((img, i) => {
      img.sortOrder = i
    })
    console.log('📝 Images after removal:', newImages)
    onImagesChange(newImages)
  }

  const setPrimaryImage = (index: number) => {
    console.log(`⭐ Setting image ${index} as primary`)
    const newImages = images.map((img, i) => ({
      ...img,
      isPrimary: i === index
    }))
    console.log('📝 Images after setting primary:', newImages)
    onImagesChange(newImages)
  }

  const handleFileUpload = async (index: number, file: File) => {
    if (!file) return

    console.log(`📤 Starting upload for index ${index}, file:`, file.name, file.size, file.type)

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 25MB)
    if (file.size > 25 * 1024 * 1024) {
      toast.error('Image size must be less than 25MB')
      return
    }

    setUploadingIndex(index)

    try {
      const formData = new FormData()
      formData.append('file', file)

      console.log('🌐 Sending upload request...')
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      })

      console.log('📡 Upload response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Upload failed:', errorText)
        throw new Error('Failed to upload image')
      }

      const result = await response.json()
      console.log('✅ Upload successful:', result)
      
      // Update the image URL
      updateImage(index, 'imageUrl', result.url)
      
      // Auto-generate alt text from filename if empty
      if (!images[index]?.altText) {
        const altText = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ')
        updateImage(index, 'altText', altText)
      }

      toast.success('Image uploaded successfully!')
    } catch (error) {
      console.error('💥 Upload error:', error)
      toast.error('Failed to upload image')
    } finally {
      setUploadingIndex(null)
    }
  }

  const triggerFileInput = (index: number) => {
    console.log(`📁 Triggering file input for index ${index}`)
    const input = fileInputRefs.current[index]
    if (input) {
      input.click()
    }
  }

  return (
    <div className="space-y-4">
      {images.map((image, index) => (
        <div key={index} className="border rounded-lg p-4">
          <input
            ref={(el) => { fileInputRefs.current[index] = el }}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                console.log(`📎 File selected for index ${index}:`, file.name)
                handleFileUpload(index, file)
              }
            }}
          />
          
          <div className="flex gap-4">
            {/* Image Preview */}
            <div className="w-24 h-24 border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center flex-shrink-0">
              {image.imageUrl ? (
                <Image
                  src={image.imageUrl}
                  alt={image.altText || 'Product image'}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                  onError={() => {
                    console.error('🖼️ Image failed to load:', image.imageUrl)
                    updateImage(index, 'imageUrl', '')
                  }}
                />
              ) : (
                <ImageIcon className="h-8 w-8 text-gray-400" />
              )}
            </div>

            {/* Image Controls */}
            <div className="flex-1 space-y-3">
              {/* Upload Button */}
              <div>
                <Label>Upload Image</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => triggerFileInput(index)}
                    disabled={uploadingIndex === index}
                    className="flex-1"
                  >
                    {uploadingIndex === index ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        {image.imageUrl ? 'Replace Image' : 'Choose Image'}
                      </>
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Alt Text */}
              <div>
                <Label>Alt Text (for accessibility)</Label>
                <Input
                  value={image.altText}
                  onChange={(e) => updateImage(index, 'altText', e.target.value)}
                  placeholder="Describe the image"
                />
              </div>

              {/* Primary Image Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`primary-${index}`}
                  checked={image.isPrimary}
                  onCheckedChange={() => setPrimaryImage(index)}
                />
                <Label htmlFor={`primary-${index}`}>Primary Image</Label>
              </div>

              {/* Image URL Display (read-only) */}
              {image.imageUrl && (
                <div>
                  <Label className="text-xs text-muted-foreground">Image Path</Label>
                  <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
                    {image.imageUrl}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {images.length === 0 && (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <ImageIcon className="mx-auto h-12 w-12 mb-4" />
          <p className="mb-2">No images added yet</p>
          <p className="text-sm mb-4">Upload high-quality images to showcase your product</p>
          <Button type="button" variant="outline" onClick={addImage}>
            Add First Image
          </Button>
        </div>
      )}

      {images.length > 0 && (
        <Button type="button" variant="outline" onClick={addImage} className="w-full">
          <Upload className="mr-2 h-4 w-4" />
          Add Another Image
        </Button>
      )}

      {/* Debug Info */}
      <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
        <strong>Debug:</strong> {images.length} images, Primary: {images.findIndex(img => img.isPrimary)}
      </div>
    </div>
  )
}
