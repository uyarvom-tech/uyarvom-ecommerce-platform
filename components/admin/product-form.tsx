'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Plus, Trash2, Upload, X } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Category {
  id: string
  name: string
  slug: string
  parentId: string | null
  children?: Category[]
}

interface ProductFormProps {
  categories: Category[]
  product?: any
  defaultCategoryId?: string
  redirectPath?: string
}

interface FormImage {
  id?: string
  imageUrl: string
  altText: string
  sortOrder?: number
}

interface FormColor {
  id: string
  colorName: string
  colorCode: string
  images: FormImage[]
  sizeData: Record<string, { price: string; stock: string; sku: string; isActive: boolean }>
}

const createEmptyColor = (): FormColor => ({
  id: `color-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  colorName: 'Default',
  colorCode: '#000000',
  images: [],
  sizeData: {
    Default: {
      price: '',
      stock: '1',
      sku: '',
      isActive: true,
    },
  },
})

export function ProductForm({ categories, product, defaultCategoryId, redirectPath }: ProductFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [enableColorVariants, setEnableColorVariants] = useState<boolean>(Array.isArray(product?.colors) ? product.colors.length > 1 : false)
  const [enableSizeVariants, setEnableSizeVariants] = useState<boolean>(() => {
    const existingSizes = product?.colors?.flatMap((color: any) => color.sizes?.map((size: any) => size.size) || []) || []
    return existingSizes.length > 1 || (existingSizes.length === 1 && existingSizes[0] !== 'Default')
  })

  const mainCategoryParam = searchParams.get('mainCategory')
  const subCategoryParam = searchParams.get('subCategory')

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
    mainCategoryId: product?.mainCategoryId || mainCategoryParam || defaultCategoryId || '',
    subCategoryId: product?.subCategoryId || subCategoryParam || '',
    isActive: product?.isActive ?? true,
    isFeatured: product?.isFeatured ?? false,
  })

  const [sizeInput, setSizeInput] = useState<string>(() => {
    const existingSizes = product?.colors?.flatMap((color: any) => color.sizes?.map((size: any) => size.size) || []) || []
    return existingSizes.length > 0 ? Array.from(new Set(existingSizes)).join(', ') : 'S, M, L'
  })

  const parsedSizes = useMemo(() => {
    if (!enableSizeVariants) {
      return ['Default']
    }

    return sizeInput
      .split(',')
      .map((size) => size.trim())
      .filter(Boolean)
  }, [enableSizeVariants, sizeInput])

  const [colors, setColors] = useState<FormColor[]>(() => {
    if (Array.isArray(product?.colors) && product.colors.length > 0) {
      return product.colors.map((color: any, colorIndex: number) => {
          const sizeData: Record<string, { price: string; stock: string; sku: string; isActive: boolean }> = {}
          ;(color.sizes || []).forEach((size: any, sizeIndex: number) => {
            sizeData[size.size] = {
              price: size.price?.toString() || '',
              stock: size.stock?.toString() || '1',
              sku: size.sku || '',
              isActive: size.isActive ?? true,
            }
          })

        return {
          id: color.id || `color-${colorIndex}`,
          colorName: color.colorName || '',
          colorCode: color.colorCode || '#000000',
          images: (color.images || []).map((img: any, imageIndex: number) => ({
            id: img.id,
            imageUrl: img.imageUrl,
            altText: img.altText || '',
            sortOrder: img.sortOrder ?? imageIndex,
          })),
          sizeData,
        }
      })
    }

    return [createEmptyColor()]
  })

  const totalVariantStock = useMemo(() => {
    return colors.reduce((total, color) => {
      return (
        total +
        Object.values(color.sizeData).reduce((sum, size) => {
          const parsed = Number(size.stock || 0)
          return sum + (Number.isFinite(parsed) ? parsed : 0)
        }, 0)
      )
    }, 0)
  }, [colors])

  useEffect(() => {
    setColors((prev) =>
      prev.map((color) => {
        const nextSizeData: FormColor['sizeData'] = {}

        parsedSizes.forEach((size) => {
          nextSizeData[size] = color.sizeData[size] || {
            price: '',
            stock: '1',
            sku: '',
            isActive: true,
          }
        })

        return { ...color, sizeData: nextSizeData }
      })
    )
  }, [parsedSizes.join('|')])

  const mainCategories = categories.filter((cat) => !cat.parentId)
  const subCategoriesByParent = categories
    .filter((cat) => cat.parentId)
    .reduce((acc, cat) => {
      if (!acc[cat.parentId!]) acc[cat.parentId!] = []
      acc[cat.parentId!].push(cat)
      return acc
    }, {} as Record<string, Category[]>)

  const availableSubCategories = formData.mainCategoryId ? subCategoriesByParent[formData.mainCategoryId] || [] : []

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value }

      if (field === 'mainCategoryId') {
        next.subCategoryId = ''
      }

      if (field === 'name' && !product) {
        const slug = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
        const sku = !prev.sku
          ? `UYV-${value.toLowerCase().replace(/[^a-z0-9]+/g, '').substring(0, 6).toUpperCase()}-${Date.now().toString().slice(-3)}`
          : prev.sku

        setFormData((prevData) => ({ ...prevData, slug, sku }))
        return next
      }

      return next
    })
  }

  const updateColor = (colorId: string, updates: Partial<FormColor>) => {
    setColors((prev) => prev.map((color) => (color.id === colorId ? { ...color, ...updates } : color)))
  }

  const addColor = () => setColors((prev) => [...prev, createEmptyColor()])
  const removeColor = (colorId: string) => setColors((prev) => prev.filter((color) => color.id !== colorId))

  const uploadColorImages = async (colorId: string, files: FileList) => {
    const uploaded: FormImage[] = []

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
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => null)
          throw new Error(errorData?.error || `Failed to upload ${file.name}`)
        }

        const data = await response.json()
        uploaded.push({
          id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          imageUrl: data.url,
          altText: file.name,
          sortOrder: uploaded.length,
        })
      } catch (error: any) {
        console.error('Image upload error:', error)
        toast.error(error.message || `Failed to upload ${file.name}`)
      }
    }

    if (uploaded.length > 0) {
      setColors((prev) =>
        prev.map((color) => {
          if (color.id !== colorId) return color
          const existingImages = color.images || []
          return {
            ...color,
            images: [...existingImages, ...uploaded].map((img, index) => ({
              ...img,
              sortOrder: index,
            })),
          }
        })
      )
    }
  }

  const validateAndBuildPayload = () => {
    if (!formData.name || !formData.slug || !formData.price || !formData.mainCategoryId || !formData.subCategoryId) {
      throw new Error('Please fill in all required fields including main category and sub-category')
    }

    if (!parsedSizes.length) {
      throw new Error('Please define at least one size option')
    }

    if (colors.length === 0) {
      throw new Error('Please add at least one color')
    }

    const colorsPayload = colors.map((color) => {
      const colorName = color.colorName.trim() || 'Default'

      if (enableColorVariants && !colorName) {
        throw new Error('Every color must have a name')
      }

      if (color.images.length === 0) {
        throw new Error(`Please upload at least one image for ${colorName || 'a color'}`)
      }

      const sizes = parsedSizes.map((size, index) => {
        const sizeState = color.sizeData[size]
        if (!sizeState) {
          throw new Error(`Please complete the ${size} size for ${colorName}`)
        }

        return {
          size,
          price: sizeState.price,
          stock: sizeState.stock,
          sku: sizeState.sku,
          isActive: sizeState.isActive,
          sortOrder: index,
        }
      })

      return {
        id: color.id,
        colorName,
        colorCode: color.colorCode,
        images: color.images,
        sizes,
      }
    })

    const totalStock = colorsPayload.reduce((total, color) => {
      return (
        total +
        color.sizes.reduce((sum, size) => {
          const parsed = Number(size.stock || 0)
          return sum + (Number.isFinite(parsed) ? parsed : 0)
        }, 0)
      )
    }, 0)

    return {
      ...formData,
      price: parseFloat(String(formData.price)),
      compareAtPrice: formData.compareAtPrice ? parseFloat(String(formData.compareAtPrice)) : null,
      stockQuantity: totalStock,
      lowStockThreshold: parseInt(String(formData.lowStockThreshold)),
      weight: formData.weight ? parseFloat(String(formData.weight)) : null,
      colors: colorsPayload,
      enableColorVariants,
      enableSizeVariants,
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const productData = validateAndBuildPayload()
      const url = '/api/admin/products'
      const method = product ? 'PUT' : 'POST'
      const body = product ? { ...productData, id: product.id, categoryIds: [formData.mainCategoryId, formData.subCategoryId] } : productData

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || 'Failed to save product')
      }

      const result = await response.json()

      toast.success(product ? 'Product updated successfully!' : 'Product created successfully!')
      router.push(product ? redirectPath || '/admin/products' : redirectPath || '/admin/products')
      return result
    } catch (error: any) {
      console.error('Product form submit error:', error)
      toast.error(error.message || 'Failed to save product. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input id="name" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} placeholder="Enter product name" required />
              </div>

              <div>
                <Label htmlFor="slug">URL Slug *</Label>
                <Input id="slug" value={formData.slug} onChange={(e) => handleInputChange('slug', e.target.value)} placeholder="product-url-slug" required />
              </div>

              <div>
                <Label htmlFor="shortDescription">Short Description</Label>
                <Input id="shortDescription" value={formData.shortDescription} onChange={(e) => handleInputChange('shortDescription', e.target.value)} placeholder="Brief product description" />
              </div>

              <div>
                <Label htmlFor="description">Full Description</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} placeholder="Detailed product description" rows={4} />
              </div>
            </CardContent>
          </Card>

          <Card>
          <CardHeader>
            <CardTitle>Color Images</CardTitle>
            <p className="text-sm text-muted-foreground">
                Start simple with one default color and size, or turn on the extra variant options below.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-4 rounded-lg border bg-muted/20 p-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="enableColorVariants"
                  checked={enableColorVariants}
                  onCheckedChange={(checked) => setEnableColorVariants(checked === true)}
                />
                <Label htmlFor="enableColorVariants" className="text-sm">
                  Add more colors
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="enableSizeVariants"
                  checked={enableSizeVariants}
                  onCheckedChange={(checked) => setEnableSizeVariants(checked === true)}
                />
                <Label htmlFor="enableSizeVariants" className="text-sm">
                  Add more sizes
                </Label>
              </div>
            </div>

              <div>
                <Label htmlFor="sizes">Available Sizes {enableSizeVariants ? '*' : ''}</Label>
                <Input
                  id="sizes"
                  value={enableSizeVariants ? sizeInput : 'Default'}
                  onChange={(e) => setSizeInput(e.target.value)}
                  placeholder="S, M, L"
                  disabled={!enableSizeVariants}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {enableSizeVariants ? 'Separate sizes with commas.' : 'Basic mode uses one default size.'}
                </p>
              </div>

              <div className="space-y-4">
                {colors.map((color, index) => (
                  <Card key={color.id} className="border-dashed">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          Color {index + 1}
                        </CardTitle>
                        {enableColorVariants && colors.length > 1 && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeColor(color.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label>Color Name</Label>
                          <Input
                            value={color.colorName}
                            onChange={(e) => updateColor(color.id, { colorName: e.target.value })}
                            placeholder={enableColorVariants ? 'Red' : 'Default'}
                          />
                        </div>
                        <div>
                          <Label>Color Code</Label>
                          <Input
                            type="color"
                            value={color.colorCode}
                            onChange={(e) => updateColor(color.id, { colorCode: e.target.value })}
                            className="w-20 h-10 p-1"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label>Images for this Color</Label>
                        <div className="flex flex-wrap gap-3">
                          <input
                            id={`color-upload-${color.id}`}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => e.target.files && uploadColorImages(color.id, e.target.files)}
                          />
                          <label
                            htmlFor={`color-upload-${color.id}`}
                            className="flex items-center gap-2 px-4 py-2 border border-dashed rounded-md cursor-pointer hover:border-primary"
                          >
                            <Upload className="h-4 w-4" />
                            Upload Images
                          </label>
                        </div>

                        {color.images.length > 0 && (
                          <div className="flex flex-wrap gap-3">
                            {color.images.map((image, imageIndex) => (
                              <div key={`${image.imageUrl}-${imageIndex}`} className="relative w-24">
                                <img src={image.imageUrl} alt={image.altText} className="h-24 w-24 rounded object-cover border" />
                                <button
                                  type="button"
                                  className="absolute -top-2 -right-2 rounded-full bg-destructive text-white p-1"
                                  onClick={() =>
                                    updateColor(color.id, {
                                      images: color.images.filter((_, idx) => idx !== imageIndex).map((img, idx) => ({ ...img, sortOrder: idx })),
                                    })
                                  }
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <Label>Sizes for this Color</Label>
                        <div className="grid gap-3">
                          {parsedSizes.map((size) => {
                            const sizeState = color.sizeData[size] || { price: '', stock: '', sku: '', isActive: true }
                            return (
                              <div key={size} className="grid gap-3 rounded-md border p-3 md:grid-cols-4">
                                <div className="font-medium">{size}</div>
                                <div>
                                  <Label className="text-xs">Price Override</Label>
                                  <Input
                                    type="number"
                                    value={sizeState.price}
                                    onChange={(e) =>
                                      updateColor(color.id, {
                                        sizeData: {
                                          ...color.sizeData,
                                          [size]: { ...sizeState, price: e.target.value },
                                        },
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Stock</Label>
                                  <Input
                                    type="number"
                                    value={sizeState.stock}
                                    onChange={(e) =>
                                      updateColor(color.id, {
                                        sizeData: {
                                          ...color.sizeData,
                                          [size]: { ...sizeState, stock: e.target.value },
                                        },
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">SKU</Label>
                                  <Input
                                    value={sizeState.sku}
                                    onChange={(e) =>
                                      updateColor(color.id, {
                                        sizeData: {
                                          ...color.sizeData,
                                          [size]: { ...sizeState, sku: e.target.value },
                                        },
                                      })
                                    }
                                  />
                                </div>
                                <div className="md:col-span-4 flex items-center gap-2">
                                  <Checkbox
                                    checked={sizeState.isActive}
                                    onCheckedChange={(checked) =>
                                      updateColor(color.id, {
                                        sizeData: {
                                          ...color.sizeData,
                                          [size]: { ...sizeState, isActive: checked === true },
                                        },
                                      })
                                    }
                                  />
                                  <Label className="text-sm">Active</Label>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {enableColorVariants && (
                <Button type="button" variant="outline" onClick={addColor} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Another Color
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="price">Price (₹) *</Label>
                <Input id="price" type="number" step="0.01" value={formData.price} onChange={(e) => handleInputChange('price', e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="compareAtPrice">Compare at Price (₹)</Label>
                <Input id="compareAtPrice" type="number" step="0.01" value={formData.compareAtPrice} onChange={(e) => handleInputChange('compareAtPrice', e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inventory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Total Variant Stock</Label>
                <div className="rounded-md border bg-muted/40 px-3 py-2 font-medium">
                  {totalVariantStock}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Derived from the color and size variants below. Product-level stock is no longer edited here.
                </p>
              </div>
              <div>
                <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                <Input id="lowStockThreshold" type="number" value={formData.lowStockThreshold} onChange={(e) => handleInputChange('lowStockThreshold', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="sku">SKU (Optional)</Label>
                <Input id="sku" value={formData.sku} onChange={(e) => handleInputChange('sku', e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Organization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="mainCategory">Main Category *</Label>
                  <Select value={formData.mainCategoryId} onValueChange={(value) => handleInputChange('mainCategoryId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select main category" />
                    </SelectTrigger>
                    <SelectContent>
                      {mainCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="subCategory">Sub-Category *</Label>
                  <Select value={formData.subCategoryId} onValueChange={(value) => handleInputChange('subCategoryId', value)} disabled={!formData.mainCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder={formData.mainCategoryId ? 'Select sub-category' : 'Select main category first'} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSubCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input id="weight" type="number" step="0.01" value={formData.weight} onChange={(e) => handleInputChange('weight', e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="isActive" checked={formData.isActive} onCheckedChange={(checked) => handleInputChange('isActive', checked === true)} />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="isFeatured" checked={formData.isFeatured} onCheckedChange={(checked) => handleInputChange('isFeatured', checked === true)} />
                <Label htmlFor="isFeatured">Featured</Label>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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
