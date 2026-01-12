"use client"

import { useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

export function ProductGallery({ images, productName }: { images: any[]; productName: string }) {
  const [selectedImage, setSelectedImage] = useState(0)

  const displayImages =
    images.length > 0
      ? images
      : [{ imageUrl: `/placeholder.svg?height=600&width=600&query=${productName}`, altText: productName }]

  return (
    <div className="space-y-4">
      <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
        <Image
          src={displayImages[selectedImage].imageUrl || "/placeholder.svg"}
          alt={displayImages[selectedImage].altText || productName}
          width={600}
          height={600}
          className="h-full w-full object-cover"
          priority
        />
      </div>

      {displayImages.length > 1 && (
        <div className="grid grid-cols-4 gap-4">
          {displayImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={cn(
                "aspect-square overflow-hidden rounded-md border-2 transition-all",
                selectedImage === index ? "border-primary" : "border-transparent hover:border-muted-foreground/50",
              )}
            >
              <Image
                src={image.imageUrl || "/placeholder.svg"}
                alt={image.altText || `${productName} ${index + 1}`}
                width={150}
                height={150}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
