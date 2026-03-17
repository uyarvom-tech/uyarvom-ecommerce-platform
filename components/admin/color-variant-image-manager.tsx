'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus, Upload, Palette, GripVertical, X } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

interface ColorVariantImage {
  id: string
  imageUrl: string
  altText: string
  sortOrder: number
}

interface ColorVariant {
  id: string
  colorName: string
  colorCode: string
  price?: string
  stock?: string
  sku?: string
  images: ColorVariantImage[]
}

interface ColorVariantImageManagerProps {
  onVariantsChange: (variants: ColorVariant[]) => void
  initialVariants?: ColorVariant[]
}

export default function ColorVariantImageManager({
  onVariantsChange,
  initialVariants = []
}: ColorVariantImageManagerProps) {
  const [colorVariants, setColorVariants] = useState<ColorVariant[]>(() => {
    // Ensure each variant has a unique ID and proper structure
    return initialVariants.map((variant, index) => ({
      ...variant,
      id: variant.id || `color-${Date.now()}-${index}`,
      images: (variant.images || []).map((img, imgIndex) => ({
        ...img,
        id: img.id || `img-${Date.now()}-${index}-${imgIndex}`,
        sortOrder: img.sortOrder || imgIndex
      }))
    }))
  })
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // Update colorVariants when initialVariants change (for edit mode)
  useEffect(() => {
    if (initialVariants.length > 0 && colorVariants.length === 0) {
      const processedVariants = initialVariants.map((variant, index) => ({
        ...variant,
        id: variant.id || `color-${Date.now()}-${index}`,
        images: (variant.images || []).map((img, imgIndex) => ({
          ...img,
          id: img.id || `img-${Date.now()}-${index}-${imgIndex}`,
          sortOrder: img.sortOrder || imgIndex
        }))
      }))
      setColorVariants(processedVariants)
      onVariantsChange(processedVariants)
    }
  }, [initialVariants, colorVariants.length, onVariantsChange])

  const addNewColorVariant = () => {
    const newVariant: ColorVariant = {
      id: `color-${Date.now()}`,
      colorName: '',
      colorCode: '#000000',
      images: []
    }
    const updatedVariants = [...colorVariants, newVariant]
    setColorVariants(updatedVariants)
    onVariantsChange(updatedVariants)
  }

  const updateColorVariant = (variantId: string, updates: Partial<ColorVariant>) => {
    const updatedVariants = colorVariants.map(variant =>
      variant.id === variantId ? { ...variant, ...updates } : variant
    )
    setColorVariants(updatedVariants)
    onVariantsChange(updatedVariants)
  }

  const removeColorVariant = (variantId: string) => {
    const updatedVariants = colorVariants.filter(variant => variant.id !== variantId)
    setColorVariants(updatedVariants)
    onVariantsChange(updatedVariants)
  }

  const handleImageUpload = async (variantId: string, files: FileList) => {
    const uploadedImages: ColorVariantImage[] = []

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`)
        continue
      }

      const formData = new FormData()
      formData.append('file', file)

      try {
        const response = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData
        })

        if (response.ok) {
          const data = await response.json()
          uploadedImages.push({
            id: `img-${Date.now()}-${Math.random()}`,
            imageUrl: data.url,
            altText: file.name,
            sortOrder: 0
          })
        } else {
          const errorData = await response.json()
          toast.error(`Failed to upload ${file.name}: ${errorData.error}`)
        }
      } catch (error) {
        console.error('Error uploading file:', error)
        toast.error(`Failed to upload ${file.name}`)
      }
    }

    if (uploadedImages.length > 0) {
      const variant = colorVariants.find(v => v.id === variantId)

      if (variant) {
        const updatedImages = [...variant.images, ...uploadedImages].map((img, index) => ({
          ...img,
          sortOrder: index
        }))
        updateColorVariant(variantId, { images: updatedImages })
        toast.success(`${uploadedImages.length} images uploaded successfully`)

        // Use first uploaded image for color picking
        if (uploadedImages[0] && !variant.colorCode) {
          setTimeout(() => {
            loadImageToCanvas(uploadedImages[0].imageUrl, variantId)
          }, 100)
        }
      }
    }
  }

  const loadImageToCanvas = (imageUrl: string, variantId: string) => {
    const canvas = canvasRef.current
    const img = imageRef.current
    if (!canvas || !img) return

    img.onload = () => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const maxWidth = 300
      const maxHeight = 200

      let { width, height } = img

      if (width > maxWidth || height > maxHeight) {
        const widthRatio = maxWidth / width
        const heightRatio = maxHeight / height
        const ratio = Math.min(widthRatio, heightRatio)

        width = width * ratio
        height = height * ratio
      }

      canvas.width = width
      canvas.height = height
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, width, height)

      setShowColorPicker(variantId)
    }

    img.src = imageUrl
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>, variantId: string) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const imageData = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1)
    const [r, g, b] = imageData.data

    const hexColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`

    updateColorVariant(variantId, { colorCode: hexColor })

    // Visual feedback
    ctx.save()
    ctx.strokeStyle = '#ffffff'
    ctx.fillStyle = hexColor
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(x, y, 6, 0, 2 * Math.PI)
    ctx.fill()
    ctx.stroke()
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.restore()

    toast.success(`Color picked: ${hexColor}`)
  }

  const handleDragEnd = (result: any, variantId: string) => {
    if (!result.destination) return

    const variant = colorVariants.find(v => v.id === variantId)
    if (!variant) return

    const items = Array.from(variant.images)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    const updatedImages = items.map((img, index) => ({
      ...img,
      sortOrder: index
    }))

    updateColorVariant(variantId, { images: updatedImages })
  }

  const removeImage = (variantId: string, imageId: string) => {
    const variant = colorVariants.find(v => v.id === variantId)
    if (!variant) return

    const updatedImages = variant.images
      .filter(img => img.id !== imageId)
      .map((img, index) => ({ ...img, sortOrder: index }))

    updateColorVariant(variantId, { images: updatedImages })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Color Variants</h3>
          <p className="text-sm text-gray-600">Upload images for each color variant</p>
        </div>
        <Button
          type="button"
          onClick={addNewColorVariant}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Another Color
        </Button>
      </div>

      {colorVariants.length === 0 && (
        <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
              <Palette className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">First Color Variant Ready</h3>
              <p className="text-sm text-gray-600 mt-2">
                The first color variant should appear automatically. If not, there might be an issue.
              </p>
            </div>
          </div>
        </div>
      )}

      {colorVariants.map((variant, variantIndex) => (
        <Card key={variant.id} className="overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {variantIndex === 0 ? 'First Color' : `Color ${variantIndex + 1}`}
              </CardTitle>
              {variantIndex > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeColorVariant(variant.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Variant Specifics */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Inventory (Stock)</Label>
                <Input
                  type="number"
                  value={variant.stock || ''}
                  onChange={(e) => updateColorVariant(variant.id, { stock: e.target.value })}
                  placeholder="100"
                />
              </div>
              <div>
                <Label>Variant SKU</Label>
                <Input
                  value={variant.sku || ''}
                  onChange={(e) => updateColorVariant(variant.id, { sku: e.target.value })}
                  placeholder="Leave empty for auto-SKU"
                />
              </div>
              <div>
                <Label>Price Override (₹)</Label>
                <Input
                  type="number"
                  value={variant.price || ''}
                  onChange={(e) => updateColorVariant(variant.id, { price: e.target.value })}
                  placeholder="Uses base price if empty"
                />
              </div>
            </div>

            {/* Color Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Color Name</Label>
                <Input
                  value={variant.colorName}
                  onChange={(e) => updateColorVariant(variant.id, { colorName: e.target.value })}
                  placeholder="e.g., Ocean Blue, Fire Red"
                />
              </div>
              <div>
                <Label>Color Code</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={variant.colorCode}
                    onChange={(e) => updateColorVariant(variant.id, { colorCode: e.target.value })}
                    className="w-16 h-10 p-1 border rounded"
                  />
                  <Input
                    value={variant.colorCode}
                    onChange={(e) => updateColorVariant(variant.id, { colorCode: e.target.value })}
                    placeholder="#000000"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-4">
              <Label>Upload Images for this Color</Label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => e.target.files && handleImageUpload(variant.id, e.target.files)}
                  className="hidden"
                  id={`upload-${variant.id}`}
                />
                <label
                  htmlFor={`upload-${variant.id}`}
                  className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400"
                >
                  <Upload className="h-4 w-4" />
                  Upload Images
                </label>
                <p className="text-sm text-gray-600">
                  Select multiple images (inside, outside, etc.)
                </p>
              </div>
            </div>

            {/* Color Picker */}
            {showColorPicker === variant.id && variant.images.length > 0 && (
              <div className="space-y-4">
                <Label className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Click on the image to pick the color
                </Label>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-center">
                    <canvas
                      ref={canvasRef}
                      onClick={(e) => handleCanvasClick(e, variant.id)}
                      className="cursor-crosshair border rounded shadow-sm"
                    />
                  </div>
                  <img
                    ref={imageRef}
                    className="hidden"
                    alt="Color picker source"
                  />
                </div>
              </div>
            )}

            {/* Images Grid with Drag & Drop */}
            {variant.images.length > 0 && (
              <div className="space-y-2">
                <Label>Images ({variant.images.length}) - Drag to reorder</Label>
                <DragDropContext onDragEnd={(result) => handleDragEnd(result, variant.id)}>
                  <Droppable droppableId={`images-${variant.id}`} direction="horizontal">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="flex gap-4 overflow-x-auto pb-2"
                      >
                        {variant.images.map((image, index) => (
                          <Draggable key={image.id} draggableId={`${variant.id}-${image.id}`} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`relative group flex-shrink-0 ${snapshot.isDragging ? 'opacity-75' : ''
                                  }`}
                              >
                                <div className="relative">
                                  <Image
                                    src={image.imageUrl}
                                    alt={image.altText}
                                    width={120}
                                    height={120}
                                    className="w-30 h-24 object-cover rounded border-2 border-gray-200"
                                  />
                                  <div
                                    {...provided.dragHandleProps}
                                    className="absolute top-1 left-1 bg-black/70 text-white p-1 rounded cursor-move opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <GripVertical className="h-3 w-3" />
                                  </div>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="destructive"
                                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                                    onClick={() => removeImage(variant.id, image.id)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                  <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1 rounded">
                                    {index + 1}
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {colorVariants.length === 0 ? (
        <div className="text-center p-4 text-gray-500">
          <p>First color variant should appear automatically</p>
        </div>
      ) : (
        <div className="text-center">
          <Button
            type="button"
            onClick={addNewColorVariant}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Another Color
          </Button>
        </div>
      )}
    </div>
  )
}
