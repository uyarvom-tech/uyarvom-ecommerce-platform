'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Product {
  id: string
  images: any[]
}

interface GenerateSubcategoryImagesButtonProps {
  categoryId: string
  subCategoryId: string
  products: Product[]
  onSuccess?: () => void
}

export function GenerateSubcategoryImagesButton({
  categoryId,
  subCategoryId,
  products,
  onSuccess,
}: GenerateSubcategoryImagesButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDisabled, setIsDisabled] = useState(false)

  // Check if all products have 4 images
  useEffect(() => {
    const allProductsHaveMaxImages = products.every((p) => p.images?.length >= 4)
    setIsDisabled(allProductsHaveMaxImages)
  }, [products])

  const productsNeedingImages = products.filter((p) => (p.images?.length || 0) < 4)

  const handleGenerateAll = async () => {
    if (productsNeedingImages.length === 0) {
      toast.info('All products already have maximum images')
      return
    }

    const confirmMessage = `This will generate images for ${productsNeedingImages.length} product(s). This may take a few minutes. Continue?`
    
    if (!confirm(confirmMessage)) {
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch(
        `/api/admin/categories/${categoryId}/${subCategoryId}/generate-all-images`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate images')
      }

      if (data.success) {
        toast.success(
          `Processed ${data.processed} product(s), generated ${data.totalGenerated} image(s)`
        )
        onSuccess?.()
      } else {
        toast.error(data.message || 'Image generation failed')
      }
    } catch (error) {
      console.error('Error generating images:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate images')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button
      onClick={handleGenerateAll}
      disabled={isGenerating || isDisabled}
      className="bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-300 disabled:text-gray-500 rounded-none h-11 px-6 text-[10px] font-black uppercase tracking-widest"
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating for all products...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" />
          Fill All Images ({productsNeedingImages.length})
        </>
      )}
    </Button>
  )
}
