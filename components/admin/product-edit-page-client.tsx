'use client'

import { useRouter } from 'next/navigation'
import { ProductForm } from '@/components/admin/product-form'
import { GenerateImagesButton } from '@/components/admin/generate-images-button'

interface ProductEditPageClientProps {
  productId: string
  product: any
  categories: any[]
  existingImageCount: number
}

export function ProductEditPageClient({
  productId,
  product,
  categories,
  existingImageCount,
}: ProductEditPageClientProps) {
  const router = useRouter()

  return (
    <main className="flex-1 container mx-auto px-6 py-8 max-w-7xl">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
          <p className="text-muted-foreground">
            Update product information, images, and settings
          </p>
        </div>
        
        <GenerateImagesButton 
          productId={productId}
          existingImageCount={existingImageCount}
          onSuccess={() => router.refresh()}
        />
      </div>

      <ProductForm categories={categories} product={product} />
    </main>
  )
}
