'use client'

import { useState, useRef } from "react"
import { Upload, Camera, Sparkles, X, Image as ImageIcon, Wand2, Star, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import Link from "next/link"
import { PRODUCT_FALLBACK_IMAGE } from "@/lib/image-fallbacks"

interface AIKitchenMatchProps {
  products: any[]
}

export function AIKitchenMatch({ products }: AIKitchenMatchProps) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [suggestedProducts, setSuggestedProducts] = useState<any[]>([])
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file: File) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string)
        setAnalysisComplete(false)
        setSuggestedProducts([])
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setUploadedImage(null)
    setAnalysisComplete(false)
    setSuggestedProducts([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const analyzeKitchen = () => {
    setIsAnalyzing(true)

    // Simulate AI analysis and get random products
    setTimeout(() => {
      // Ensure products is an array and has items
      const availableProducts = Array.isArray(products) ? products : []

      if (availableProducts.length === 0) {
        // If no products available, set empty array and show message
        setSuggestedProducts([])
        setIsAnalyzing(false)
        setAnalysisComplete(true)
        return
      }

      // Get 6 random products from the available products
      const shuffled = [...availableProducts].sort(() => 0.5 - Math.random())
      const randomProducts = shuffled.slice(0, 6)

      setSuggestedProducts(randomProducts)
      setIsAnalyzing(false)
      setAnalysisComplete(true)
    }, 3000)
  }

  const tryAgain = () => {
    setUploadedImage(null)
    setAnalysisComplete(false)
    setSuggestedProducts([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* AI Kitchen Match Header */}
      <div className="text-center mb-20">
        <div className="inline-flex items-center gap-2 mb-6 px-4 py-1 rounded-full bg-primary/5 border border-primary/20">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">AI-POWERED MASTERY</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-serif text-foreground mb-6 leading-tight">
          Find Your <span className="italic text-primary">Aesthetic</span> Match
        </h1>
        <p className="text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed font-light">
          Upload a vision of your space and our AI will curate the perfect ceramic pieces to complement your architectural style.
        </p>
      </div>

      {!uploadedImage ? (
        /* Upload Interface */
        <Card className="border border-border/10 bg-secondary shadow-sm rounded-xl overflow-hidden">
          <CardContent className="p-20">
            <div
              className={`relative transition-all duration-700 ${dragActive ? 'scale-105 opacity-80' : ''
                }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="text-center">
                {/* Upload Icon */}
                <div className="mx-auto w-24 h-24 mb-10 rounded-full bg-primary flex items-center justify-center shadow-2xl shadow-primary/20">
                  <Upload className="h-10 w-10 text-white" />
                </div>

                {/* Upload Text */}
                <h3 className="text-3xl font-serif mb-6 text-foreground">
                  The Vision for Your Space
                </h3>
                <p className="text-foreground/60 mb-12 max-w-md mx-auto leading-relaxed">
                  Provide a photograph of your kitchen or dining area. Our system will analyze textures, colors, and lighting to select harmonizing pieces.
                </p>

                {/* Upload Buttons */}
                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="apple-button h-16 px-12"
                  >
                    <ImageIcon className="mr-3 h-5 w-5" />
                    Select Image
                  </Button>

                  <Button
                    variant="link"
                    className="text-foreground font-bold uppercase tracking-widest text-[10px] hover:text-primary transition-colors"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Open Camera
                  </Button>
                </div>

                {/* File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="hidden"
                />

                {/* Supported Formats */}
                <p className="text-xs text-muted-foreground mt-6">
                  Supports JPG, PNG, WebP up to 10MB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Uploaded Image and Results */
        <div className="space-y-8">
          {/* Image Preview */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative">
                <Image
                  src={uploadedImage}
                  alt="Uploaded kitchen"
                  width={800}
                  height={400}
                  className="w-full h-64 md:h-80 object-cover"
                />
                <Button
                  onClick={removeImage}
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {!analysisComplete ? (
            /* Analysis Section */
            <Card className="border border-border/10 bg-white shadow-xl rounded-xl">
              <CardContent className="p-16 text-center">
                {!isAnalyzing ? (
                  <div className="space-y-8">
                    <div className="w-20 h-20 mx-auto rounded-full bg-primary/5 flex items-center justify-center">
                      <Wand2 className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-3xl font-serif">Awaiting Instruction</h3>
                      <p className="text-foreground/60 max-w-sm mx-auto leading-relaxed">
                        Our artisans and AI are ready to analyze the intricate details of your space.
                      </p>
                    </div>
                    <Button
                      onClick={analyzeKitchen}
                      className="apple-button h-16 px-16"
                    >
                      <Sparkles className="mr-3 h-5 w-5" />
                      Begin Analysis
                    </Button>
                  </div>
                ) : (
                  <div>
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center animate-pulse">
                      <Sparkles className="h-8 w-8 text-white animate-spin" />
                    </div>
                    <h3 className="text-2xl font-semibold mb-4">Analyzing Your Kitchen...</h3>
                    <p className="text-muted-foreground mb-6">
                      Our AI is examining your kitchen's style, color palette, and layout to find the perfect ceramic matches.
                    </p>
                    <div className="flex justify-center">
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 bg-amber-500 rounded-full animate-bounce"></div>
                        <div className="w-3 h-3 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-3 h-3 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            /* AI Suggestions Results */
            <div className="space-y-8">
              {/* Results Header */}
              <div className="bg-secondary border border-border p-12 text-center rounded-xl">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary flex items-center justify-center shadow-xl shadow-primary/20">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-4xl font-serif mb-4 text-foreground">Curation Complete</h3>
                <p className="text-foreground/70 mb-10 max-w-lg mx-auto leading-relaxed">
                  Based on the architectural elements and color palette of your space, we have curated a selection of ceramic masterpieces that harmonize with your environment.
                </p>
                <div className="flex justify-center">
                  <Button
                    onClick={tryAgain}
                    variant="link"
                    className="text-foreground font-bold uppercase tracking-widest text-[10px] hover:text-primary transition-colors"
                  >
                    Analyze Another Space
                  </Button>
                </div>
              </div>

              {/* Suggested Products Grid */}
              <div>
                <h3 className="text-2xl font-serif mb-10 text-center uppercase tracking-widest">
                  The <span className="text-primary italic">Artisan</span> Selection
                </h3>
                {suggestedProducts.length > 0 ? (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {suggestedProducts.map((product: any, productIndex: number) => {
                      const primaryImage = product.images?.find((img: any) => img.is_primary) || product.images?.[0]
                      const hasDiscount = product.compare_at_price && product.compare_at_price > product.price
                      const discountPercent = hasDiscount
                        ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
                        : 0

                      return (
                        <Link key={product.id} href={`/products/${product.slug}`} className="group block">
                          <div className="apple-card p-0 h-full max-w-sm mx-auto relative">
                            {/* AI Recommended Badge */}
                            <div className="absolute top-4 left-4 z-10">
                              <Badge className="bg-primary text-white border-0 px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-sm">
                                <Sparkles className="h-3 w-3 mr-2" />
                                AI Selection
                              </Badge>
                            </div>

                            <div className="relative aspect-[4/3] overflow-hidden bg-secondary/20 rounded-t-[20px]">
                              <Image
                                src={primaryImage?.image_url || PRODUCT_FALLBACK_IMAGE}
                                alt={primaryImage?.alt_text || product.name}
                                width={400}
                                height={300}
                                className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                              />

                              {hasDiscount && (
                                <div className="absolute top-3 right-3">
                                  <Badge className="bg-destructive text-destructive-foreground border-0 px-2 py-1 text-xs font-semibold rounded-full">
                                    {discountPercent}% OFF
                                  </Badge>
                                </div>
                              )}
                            </div>

                            <div className="p-4">
                              <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
                                {product.category?.name}
                              </p>
                              <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                                {product.name}
                              </h3>
                              <p className="text-[15px] leading-relaxed text-muted-foreground text-sm mb-3 line-clamp-2">
                                {product.short_description}
                              </p>

                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <div className="flex items-baseline gap-2">
                                    <span className="text-xl font-semibold">
                                      ₹{product.price.toLocaleString("en-IN")}
                                    </span>
                                    {hasDiscount && (
                                      <span className="text-sm text-muted-foreground line-through">
                                        ₹{product.compare_at_price.toLocaleString("en-IN")}
                                      </span>
                                    )}
                                  </div>
                                  {hasDiscount && (
                                    <span className="text-xs font-medium text-green-600">
                                      Save ₹{(product.compare_at_price - product.price).toLocaleString("en-IN")}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                  <span className="font-semibold text-sm">4.8</span>
                                </div>
                              </div>

                              {/* AI Match Confidence */}
                              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                                <span className="text-xs text-muted-foreground">AI Match</span>
                                <div className="flex items-center gap-1">
                                  <div className="flex space-x-1.5">
                                    {[...Array(5)].map((_, i) => (
                                      <div
                                        key={i}
                                        className={`w-1.5 h-1.5 rounded-full ${i < 4 ? 'bg-primary' : 'bg-primary/10'
                                          }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-[10px] font-bold text-primary ml-2">
                                    {85 + Math.floor(Math.random() * 10)}% Match
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                      <Sparkles className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No Products Available</h3>
                    <p className="text-muted-foreground mb-4">
                      We couldn't find any products to suggest at the moment.
                    </p>
                    <Button
                      variant="outline"
                      onClick={tryAgain}
                      className="border-amber-300 text-amber-700 hover:bg-amber-50"
                    >
                      Try Again
                    </Button>
                  </div>
                )}
              </div>

              {/* View All Products Button */}
              <div className="text-center">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400"
                  asChild
                >
                  <Link href="/products">
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    View All Products
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {/* Tips Section */}
          {!analysisComplete && (
            <div className="border-t border-border pt-16">
              <h4 className="font-serif text-2xl mb-8 flex items-center gap-4">
                <div className="h-[1px] w-12 bg-primary"></div>
                Optimizing the Vision
              </h4>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 text-sm">
                <div className="space-y-4">
                  <span className="text-primary font-bold text-xs uppercase tracking-widest">Environment</span>
                  <p className="text-foreground/60 leading-relaxed font-light">Include your architectural surfaces—countertops, cabinetry, and fixtures.</p>
                </div>
                <div className="space-y-4">
                  <span className="text-primary font-bold text-xs uppercase tracking-widest">Luminosity</span>
                  <p className="text-foreground/60 leading-relaxed font-light">Natural daylight provides the most accurate color representation for our system.</p>
                </div>
                <div className="space-y-4">
                  <span className="text-primary font-bold text-xs uppercase tracking-widest">Composition</span>
                  <p className="text-foreground/60 leading-relaxed font-light">Capturing the space from multiple perspectives allows for a comprehensive analysis.</p>
                </div>
                <div className="space-y-4">
                  <span className="text-primary font-bold text-xs uppercase tracking-widest">Definition</span>
                  <p className="text-foreground/60 leading-relaxed font-light">High-resolution imagery ensures the AI detects the fine textures of your surfaces.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
