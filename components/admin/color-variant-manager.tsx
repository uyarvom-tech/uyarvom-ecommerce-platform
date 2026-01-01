'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trash2, Edit, Plus, Save, X, Upload, Palette, Eye, Image as ImageIcon, Move } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

interface ColorVariantImage {
  id: string
  imageUrl: string
  altText: string
  sortOrder: number
}

interface ColorVariant {
  id: string
  name: string
  value: string
  price: number | null
  stock: number
  sku: string | null
  colorCode: string | null
  colorImage: string | null
  isActive: boolean
  sortOrder: number
  images: ColorVariantImage[]
}

interface ColorVariantManagerProps {
  productId: string
  productPrice: number
}

export default function ColorVariantManager({ productId, productPrice }: ColorVariantManagerProps) {
  const [variants, setVariants] = useState<ColorVariant[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    value: '',
    price: '',
    stock: '0',
    sku: '',
    colorCode: '#000000',
    colorImage: ''
  })
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [showColorPicker, setShowColorPicker] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    fetchColorVariants()
  }, [productId])

  const fetchColorVariants = async () => {
    try {
      const response = await fetch(`/api/admin/products/${productId}/variants`)
      if (response.ok) {
        const data = await response.json()
        const colorVariants = data.filter((v: ColorVariant) => 
          v.name.toLowerCase() === 'color' && v.isActive
        )
        // For now, we'll simulate images array - later we'll add proper API
        const variantsWithImages = colorVariants.map((variant: ColorVariant) => ({
          ...variant,
          images: variant.colorImage ? [
            {
              id: `${variant.id}-1`,
              imageUrl: variant.colorImage,
              altText: `${variant.value} - Front View`,
              sortOrder: 0
            }
          ] : []
        }))
        setVariants(variantsWithImages)
      }
    } catch (error) {
      console.error('Error fetching color variants:', error)
      toast.error('Failed to load color variants')
    } finally {
      setLoading(false)
    }
  }

  const handleMultipleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const validFiles = files.filter(file => file.type.startsWith('image/'))
    if (validFiles.length !== files.length) {
      toast.error('Please select only image files')
      return
    }

    const uploadedUrls: string[] = []

    for (const file of validFiles) {
      const formData = new FormData()
      formData.append('file', file)

      try {
        const response = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData
        })

        if (response.ok) {
          const data = await response.json()
          uploadedUrls.push(data.url)
        } else {
          const errorData = await response.json()
          toast.error(`Failed to upload ${file.name}: ${errorData.error}`)
        }
      } catch (error) {
        console.error('Error uploading file:', error)
        toast.error(`Failed to upload ${file.name}`)
      }
    }

    if (uploadedUrls.length > 0) {
      setUploadedImages(uploadedUrls)
      toast.success(`${uploadedUrls.length} images uploaded successfully`)
      
      // Use first image for color picking
      if (uploadedUrls[0]) {
        setTimeout(() => {
          loadImageToCanvas(uploadedUrls[0])
        }, 100)
      }
    }
  }

  const loadImageToCanvas = (imageUrl: string) => {
    const canvas = canvasRef.current
    const img = imageRef.current
    if (!canvas || !img) return

    img.onload = () => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Calculate optimal canvas size for color picking
      const maxWidth = 300
      const maxHeight = 200
      
      let { width, height } = img
      
      // Scale image to fit within max dimensions while maintaining aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const widthRatio = maxWidth / width
        const heightRatio = maxHeight / height
        const ratio = Math.min(widthRatio, heightRatio)
        
        width = width * ratio
        height = height * ratio
      }

      // Set canvas size
      canvas.width = width
      canvas.height = height
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      
      // Draw image on canvas with smooth scaling
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, width, height)
      
      setShowColorPicker(true)
    }
    
    img.src = imageUrl
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
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
    
    setFormData(prev => ({ ...prev, colorCode: hexColor }))
    
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

  const handleSubmit = async () => {
    if (!formData.value.trim()) {
      toast.error('Color name is required')
      return
    }

    if (!formData.colorCode) {
      toast.error('Please pick a color or enter a color code')
      return
    }

    if (uploadedImages.length === 0) {
      toast.error('Please upload at least one image for this color')
      return
    }

    try {
      const url = editingId 
        ? `/api/admin/products/${productId}/variants/${editingId}`
        : `/api/admin/products/${productId}/variants`
      
      const method = editingId ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'Color',
          value: formData.value.trim(),
          price: formData.price ? parseFloat(formData.price) : null,
          stock: parseInt(formData.stock) || 0,
          sku: formData.sku.trim() || null,
          colorCode: formData.colorCode,
          colorImage: uploadedImages[0], // Primary image
          images: uploadedImages.map((url, index) => ({
            imageUrl: url,
            altText: `${formData.value} - View ${index + 1}`,
            sortOrder: index
          })),
          sortOrder: variants.length
        })
      })

      if (response.ok) {
        toast.success(editingId ? 'Color variant updated successfully' : 'Color variant created successfully')
        await fetchColorVariants()
        resetForm()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save color variant')
      }
    } catch (error) {
      console.error('Error saving color variant:', error)
      toast.error('Failed to save color variant')
    }
  }

  const handleEdit = (variant: ColorVariant) => {
    setEditingId(variant.id)
    setFormData({
      value: variant.value,
      price: variant.price?.toString() || '',
      stock: variant.stock.toString(),
      sku: variant.sku || '',
      colorCode: variant.colorCode || '#000000',
      colorImage: variant.colorImage || ''
    })
    setUploadedImages(variant.images.map(img => img.imageUrl))
    setShowAddForm(true)
    
    if (variant.images[0]) {
      setTimeout(() => {
        loadImageToCanvas(variant.images[0].imageUrl)
      }, 100)
    }
  }

  const handleDelete = async (variantId: string) => {
    if (!confirm('Are you sure you want to delete this color variant?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/products/${productId}/variants/${variantId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Color variant deleted successfully')
        await fetchColorVariants()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete color variant')
      }
    } catch (error) {
      console.error('Error deleting color variant:', error)
      toast.error('Failed to delete color variant')
    }
  }

  const resetForm = () => {
    setFormData({
      value: '',
      price: '',
      stock: '0',
      sku: '',
      colorCode: '#000000',
      colorImage: ''
    })
    setEditingId(null)
    setShowAddForm(false)
    setUploadedImages([])
    setShowColorPicker(false)
  }

  const removeImage = (indexToRemove: number) => {
    setUploadedImages(prev => prev.filter((_, index) => index !== indexToRemove))
  }

  if (loading) {
    return <div className="p-4">Loading color variants...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Color Variants & Images</h3>
        <Button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setShowAddForm(true)
          }}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Color Variant
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Color Variant' : 'Add New Color Variant'}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Upload multiple images for this color (front view, back view, side view, etc.)
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Multiple Image Upload Section */}
              <div className="space-y-4">
                <Label>Upload Images for this Color</Label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleMultipleImageUpload}
                    className="hidden"
                    id="color-images-upload"
                  />
                  <label
                    htmlFor="color-images-upload"
                    className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Multiple Images
                  </label>
                  <p className="text-sm text-gray-600">
                    Select multiple images (front, back, side views)
                  </p>
                </div>
                
                {/* Uploaded Images Preview */}
                {uploadedImages.length > 0 && (
                  <div className="space-y-2">
                    <Label>Uploaded Images ({uploadedImages.length})</Label>
                    <div className="grid grid-cols-3 gap-4">
                      {uploadedImages.map((imageUrl, index) => (
                        <div key={index} className="relative group">
                          <Image
                            src={imageUrl}
                            alt={`Color image ${index + 1}`}
                            width={120}
                            height={120}
                            className="rounded-lg object-cover border-2 border-gray-200 w-full h-24"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1 rounded">
                            {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Color Picker Section */}
              {showColorPicker && uploadedImages[0] && (
                <div className="space-y-4">
                  <Label className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Click on the image to pick the main color
                  </Label>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-center">
                      <canvas
                        ref={canvasRef}
                        onClick={handleCanvasClick}
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

              {/* Form Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="colorName">Color Name</Label>
                  <Input
                    id="colorName"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    placeholder="e.g., Ocean Blue, Forest Green"
                  />
                </div>
                <div>
                  <Label htmlFor="colorCode">Color Code</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="colorCode"
                      type="color"
                      value={formData.colorCode}
                      onChange={(e) => setFormData({ ...formData, colorCode: e.target.value })}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      value={formData.colorCode}
                      onChange={(e) => setFormData({ ...formData, colorCode: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="price">Price Override</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder={`Base: ₹${productPrice}`}
                  />
                </div>
                <div>
                  <Label htmlFor="stock">Stock Quantity</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="sku">SKU (Optional)</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="Unique identifier"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  type="button" 
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleSubmit()
                  }}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {editingId ? 'Update Color Variant' : 'Create Color Variant'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    resetForm()
                  }}
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Color Variants List */}
      {variants.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            No color variants created yet. Add color variants with multiple images for each color.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {variants.map((variant) => (
            <Card key={variant.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Color Info Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full border-2 border-gray-300"
                        style={{ backgroundColor: variant.colorCode || '#gray' }}
                      />
                      <div>
                        <h4 className="font-medium">{variant.value}</h4>
                        <p className="text-sm text-gray-500">{variant.colorCode}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{variant.images.length} images</Badge>
                  </div>

                  {/* Images Grid */}
                  {variant.images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {variant.images.map((image, index) => (
                        <div key={image.id} className="relative">
                          <Image
                            src={image.imageUrl}
                            alt={image.altText}
                            width={80}
                            height={80}
                            className="w-full h-16 object-cover rounded border"
                          />
                          <div className="absolute bottom-0 left-0 bg-black/70 text-white text-xs px-1 rounded-tr">
                            {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pricing and Stock */}
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">
                      ₹{variant.price || productPrice}
                    </span>
                    <span className="text-gray-600">
                      Stock: {variant.stock}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleEdit(variant)
                      }}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleDelete(variant.id)
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}