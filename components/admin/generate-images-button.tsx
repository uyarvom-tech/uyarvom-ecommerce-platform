'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface GenerateImagesButtonProps {
  productId: string
  existingImageCount: number
  onSuccess?: () => void
}

export function GenerateImagesButton({
  productId,
  existingImageCount,
  onSuccess,
}: GenerateImagesButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const imagesToGenerate = Math.max(0, 4 - existingImageCount)

  const handleGenerate = async () => {
    if (imagesToGenerate <= 0) {
      toast.info('Product already has maximum images')
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch(`/api/admin/products/${productId}/generate-images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate images')
      }

      if (data.success) {
        toast.success(`Successfully generated ${data.generated} image(s)`)
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

  if (imagesToGenerate <= 0) {
    return null
  }

  return (
    <Button
      onClick={handleGenerate}
      disabled={isGenerating}
      variant="outline"
      className="rounded-none border-black h-11 px-6 text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all"
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" />
          Generate {imagesToGenerate} Image{imagesToGenerate > 1 ? 's' : ''} with AI
        </>
      )}
    </Button>
  )
}
