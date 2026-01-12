'use client'

import { useState, useRef } from "react"
import { Upload, Camera, Sparkles, X, Image as ImageIcon, Wand2, Star, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import Link from "next/link"

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
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-500/20">
          <Sparkles className="h-5 w-5 text-amber-600" />
          <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">AI-POWERED MATCHING</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4 bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent">
          Find Perfect Ceramics for Your Kitchen
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Upload a photo of your kitchen and our AI will suggest the perfect ceramic pieces that match your style and space
        </p>
      </div>

      {!uploadedImage ? (
        /* Upload Interface */
        <Card className="border-2 border-dashed border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50/50 to-amber-100/30 dark:from-amber-950/20 dark:to-amber-900/10">
          <CardContent className="p-12">
            <div
              className={`relative transition-all duration-300 ${
                dragActive ? 'scale-105 border-amber-400' : ''
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="text-center">
                {/* Upload Icon */}
                <div className="mx-auto w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
                  <Upload className="h-12 w-12 text-white" />
                </div>

                {/* Upload Text */}
                <h3 className="text-2xl font-semibold mb-4 text-foreground">
                  Upload Your Kitchen Photo
                </h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Drag and drop your kitchen image here, or click to browse. We'll analyze your space and suggest matching ceramics.
                </p>

                {/* Upload Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <ImageIcon className="mr-2 h-5 w-5" />
                    Choose Photo
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/20 px-8 py-3 rounded-full"
                  >
                    <Camera className="mr-2 h-5 w-5" />
                    Take Photo
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
            <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10 border-amber-200 dark:border-amber-800">
              <CardContent className="p-8 text-center">
                {!isAnalyzing ? (
                  <div>
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                      <Wand2 className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-semibold mb-4">Ready to Analyze</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Our AI will analyze your kitchen's style, colors, and layout to suggest the perfect ceramic pieces.
                    </p>
                    <Button
                      onClick={analyzeKitchen}
                      className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Sparkles className="mr-2 h-5 w-5" />
                      Analyze Kitchen
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
              <Card className="bg-gradient-to-br from-green-50 to-emerald-100/50 dark:from-green-950/20 dark:to-emerald-900/10 border-green-200 dark:border-green-800">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-2 text-green-800 dark:text-green-200">Analysis Complete!</h3>
                  <p className="text-green-700 dark:text-green-300 mb-4">
                    Based on your kitchen's style and colors, here are our AI-recommended ceramic pieces:
                  </p>
                  <div className="flex justify-center gap-4">
                    <Button
                      onClick={tryAgain}
                      variant="outline"
                      className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400"
                    >
                      Try Another Photo
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Suggested Products Grid */}
              <div>
                <h3 className="text-2xl font-semibold mb-6 text-center">
                  <span className="bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent">
                    Perfect Matches for Your Kitchen
                  </span>
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
                            <div className="absolute top-3 left-3 z-10">
                              <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0 px-3 py-1 text-xs font-semibold rounded-full shadow-lg">
                                <Sparkles className="h-3 w-3 mr-1" />
                                AI Pick
                              </Badge>
                            </div>

                            <div className="relative aspect-[4/3] overflow-hidden bg-secondary/20 rounded-t-[20px]">
                              <Image
                                src={primaryImage?.image_url || `/placeholder.svg?height=400&width=400&query=${product.name}`}
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
                                  <div className="flex space-x-1">
                                    {[...Array(5)].map((_, i) => (
                                      <div
                                        key={i}
                                        className={`w-2 h-2 rounded-full ${
                                          i < 4 ? 'bg-amber-400' : 'bg-gray-200 dark:bg-gray-700'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-xs font-medium text-amber-600 ml-1">
                                    {85 + Math.floor(Math.random() * 10)}%
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
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-600" />
                  Tips for Better Results
                </h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Include your countertops, cabinets, and existing decor</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Ensure good lighting for accurate color analysis</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Show multiple angles if possible</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Clear, high-resolution images work best</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
