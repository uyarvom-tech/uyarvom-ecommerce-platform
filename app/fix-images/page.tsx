'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Product {
  id: string
  name: string
  images: any[]
}

export default function FixImagesPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadingFor, setUploadingFor] = useState<string | null>(null)

  const loadProducts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/fix-images')
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  const uploadImageForProduct = async (productId: string, file: File) => {
    setUploadingFor(productId)
    try {
      // First upload the file
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
      
      // Then add it to the product
      const addResponse = await fetch('/api/fix-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          imageUrl: uploadResult.url,
          altText: file.name.replace(/\.[^/.]+$/, "")
        })
      })
      
      if (!addResponse.ok) {
        throw new Error('Failed to add image to product')
      }
      
      // Reload products
      await loadProducts()
      alert('Image added successfully!')
      
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to add image')
    } finally {
      setUploadingFor(null)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>🔧 Fix Product Images - Emergency Tool</CardTitle>
          <p className="text-muted-foreground">
            This tool shows all products and lets you quickly add images to any product that's missing them.
          </p>
        </CardHeader>
        <CardContent>
          <Button onClick={loadProducts} disabled={loading} className="mb-6">
            {loading ? 'Loading...' : 'Refresh Products'}
          </Button>

          <div className="space-y-4">
            {products.map((product) => (
              <div key={product.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Images: {product.images.length} 
                      {product.images.length === 0 && <span className="text-red-500 ml-2">❌ NO IMAGES</span>}
                      {product.images.length > 0 && <span className="text-green-500 ml-2">✅ HAS IMAGES</span>}
                    </p>
                    {product.images.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {product.images.map((img, i) => (
                          <div key={i}>• {img.imageUrl} {img.isPrimary && '(Primary)'}</div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          uploadImageForProduct(product.id, file)
                        }
                      }}
                      disabled={uploadingFor === product.id}
                      className="text-sm"
                    />
                    {uploadingFor === product.id && (
                      <span className="text-sm text-blue-500">Uploading...</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {products.length === 0 && !loading && (
            <p className="text-center text-muted-foreground py-8">
              No products found. Click "Refresh Products" to load them.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
