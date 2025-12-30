'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { ImageUpload } from "@/components/admin/image-upload-simple"

interface Category {
  id: string
  name: string
  slug: string
}

interface ProductFormProps {
  categories: Category[]
  product?: any // For edit mode
}

interface ProductImage {
  id?: string
  imageUrl: string
  altText: string
  isPrimary: boolean
  sortOrder?: number
}

export function ProductForm({ categories, product }: ProductFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: product?.name || '',
    slug: product?.slug || '',
    description: product?.description || '',
    shortDescription: product?.shortDescription || '',
    price: product?.price || '',
    compareAtPrice: product?.compareAtPrice || '',
    stockQuantity: product?.stockQuantity || '',
    lowStockThreshold: product?.lowStockThreshold || '10',
    sku: product?.sku || '',
    weight: product?.weight || '',
    categoryIds: product?.categoryIds || [], // Array of category IDs
    isActive: product?.isActive ?? true,
    isFeatured: product?.isFeatured ?? false
  })

  const [images, setImages] = useState<ProductImage[]>(
    product?.images?.map((img: any, index: number) => ({
      id: img.id,
      imageUrl: img.imageUrl,
      altText: img.altText || '',
      isPrimary: img.isPrimary,
      sortOrder: img.sortOrder || index
    })) || []
  )

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      
      // Auto-generate slug from name
      if (field === 'name' && !product) {
        const slug = value.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
        
        // Auto-generate SKU from name if SKU is empty
        const sku = !prev.sku ? `UYV-${value.toLowerCase().replace(/[^a-z0-9]+/g, '').substring(0, 6).toUpperCase()}-${Date.now().toString().slice(-3)}` : prev.sku
        
        setFormData(prevData => ({ ...prevData, slug, sku }))
        return newData
      }
      
      return newData
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    console.log('🚀 FORM SUBMISSION STARTED')
    console.log('📋 Form Data:', formData)
    console.log('🖼️ Images State:', images)

    try {
      // Validate required fields
      if (!formData.name || !formData.slug || !formData.price || !formData.categoryIds.length) {
        throw new Error('Please fill in all required fields and select at least one category')
      }

      // Validate that we have at least one image
      const validImages = images.filter(img => img.imageUrl && img.imageUrl.trim() !== '')
      console.log('✅ Valid Images (non-empty URLs):', validImages)
      
      if (validImages.length === 0) {
        throw new Error('Please upload at least one product image')
      }
      
      // Ensure at least one image is marked as primary
      const hasPrimary = validImages.some(img => img.isPrimary)
      console.log('⭐ Has Primary Image:', hasPrimary)
      if (!hasPrimary) {
        validImages[0].isPrimary = true
        console.log('🔧 Auto-set first image as primary')
      }

      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : null,
        stockQuantity: parseInt(formData.stockQuantity),
        lowStockThreshold: parseInt(formData.lowStockThreshold),
        weight: formData.weight ? parseFloat(formData.weight) : null,
        images: validImages
      }

      console.log('📦 Final Product Data to Send:', productData)
      console.log('🖼️ Images in Product Data:', productData.images)

      const url = '/api/admin/products'
      const method = product ? 'PUT' : 'POST'
      const body = product ? { ...productData, id: product.id } : productData

      console.log(`🌐 API Request: ${method} ${url}`)
      console.log('📤 Request Body:', body)

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      console.log('📡 Response Status:', response.status)
      console.log('📡 Response OK:', response.ok)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ API Error Response:', errorData)
        throw new Error(errorData.error || 'Failed to save product')
      }

      const result = await response.json()
      console.log('✅ API Success Response:', result)
      console.log('🖼️ Saved Product Images:', result.images)
      
      toast.success(product ? 'Product updated successfully!' : 'Product created successfully!')
      router.push('/admin/products')
    } catch (error: any) {
      console.error('💥 FORM SUBMISSION ERROR:', error)
      toast.error(error.message || 'Failed to save product. Please try again.')
    } finally {
      setIsLoading(false)
      console.log('🏁 FORM SUBMISSION ENDED')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Product Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="slug">URL Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  placeholder="product-url-slug"
                  required
                />
              </div>

              <div>
                <Label htmlFor="shortDescription">Short Description</Label>
                <Input
                  id="shortDescription"
                  value={formData.shortDescription}
                  onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                  placeholder="Brief product description"
                />
              </div>

              <div>
                <Label htmlFor="description">Full Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Detailed product description"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Product Images */}
          <Card>
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
              <p className="text-sm text-muted-foreground">
                Upload high-quality images. The first image will be used as the primary image.
              </p>
              {/* Debug Info */}
              <div className="text-xs bg-gray-100 p-2 rounded">
                <strong>Debug:</strong> {images.length} images in state
                {images.length > 0 && (
                  <div className="mt-1">
                    {images.map((img, i) => (
                      <div key={i} className="truncate">
                        {i + 1}. {img.imageUrl} {img.isPrimary ? '(PRIMARY)' : ''}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ImageUpload 
                images={images} 
                onImagesChange={setImages} 
                productId={product?.id} 
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="price">Price (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="compareAtPrice">Compare at Price (₹)</Label>
                <Input
                  id="compareAtPrice"
                  type="number"
                  step="0.01"
                  value={formData.compareAtPrice}
                  onChange={(e) => handleInputChange('compareAtPrice', e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </CardContent>
          </Card>

          {/* Inventory */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="stockQuantity">Stock Quantity *</Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  value={formData.stockQuantity}
                  onChange={(e) => handleInputChange('stockQuantity', e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                <Input
                  id="lowStockThreshold"
                  type="number"
                  value={formData.lowStockThreshold}
                  onChange={(e) => handleInputChange('lowStockThreshold', e.target.value)}
                  placeholder="10"
                />
              </div>
              <div>
                <Label htmlFor="sku">SKU (Optional)</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => handleInputChange('sku', e.target.value)}
                  placeholder="Auto-generated if empty"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty to auto-generate from product name
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Organization */}
          <Card>
            <CardHeader>
              <CardTitle>Organization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="categories">Categories *</Label>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Select one or more categories (first selected will be primary)
                  </div>
                  <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                    {categories.map((category) => (
                      <div key={category.id} className="flex items-center space-x-2 py-1">
                        <Checkbox
                          id={`category-${category.id}`}
                          checked={formData.categoryIds.includes(category.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              handleInputChange('categoryIds', [...formData.categoryIds, category.id])
                            } else {
                              handleInputChange('categoryIds', formData.categoryIds.filter(id => id !== category.id))
                            }
                          }}
                        />
                        <Label 
                          htmlFor={`category-${category.id}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          {category.name}
                          {formData.categoryIds[0] === category.id && (
                            <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                              PRIMARY
                            </span>
                          )}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {formData.categoryIds.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Selected: {formData.categoryIds.length} categories
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.01"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onCheckedChange={(checked) => handleInputChange('isFeatured', checked)}
                />
                <Label htmlFor="isFeatured">Featured</Label>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" asChild>
          <Link href="/admin/products">Cancel</Link>
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
        </Button>
      </div>
    </form>
  )
}