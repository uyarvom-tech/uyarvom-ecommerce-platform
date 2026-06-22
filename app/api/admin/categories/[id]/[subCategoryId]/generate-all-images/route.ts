import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'
import { getPromptsForImageCount } from '@/lib/prompts/image-generation'
import { generateMultipleProductImages } from '@/lib/gemini-client'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string; subCategoryId: string }> }
) {
  const authCheck = await requireStaffAccess(request)
  if (authCheck instanceof NextResponse) return authCheck

  const { categoryId, subCategoryId } = await params

  const subCategory = await prisma.category.findUnique({
    where: { id: subCategoryId, parentId: categoryId },
  })

  if (!subCategory) {
    return NextResponse.json({ error: 'Subcategory not found' }, { status: 404 })
  }

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      productCategories: { some: { categoryId: subCategoryId } },
    },
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
      productCategories: { include: { category: true } },
    },
  })

  const productsNeedingImages = products.filter((p) => p.images.length < 4)

  if (productsNeedingImages.length === 0) {
    return NextResponse.json({
      success: true,
      message: 'All products already have maximum images',
      processed: 0,
      totalGenerated: 0,
    })
  }

  const summary: { productId: string; productName: string; generated: number; errors: string[] }[] = []
  let totalGenerated = 0

  for (const product of productsNeedingImages) {
    const existingCount = product.images.length
    const referenceImageUrl = product.images[0]?.imageUrl ?? undefined

    const primaryCategory =
      product.productCategories.find((pc) => pc.isPrimary)?.category ??
      product.productCategories[0]?.category

    if (!primaryCategory) continue

    const context = {
      category: primaryCategory.name,
      productName: product.name,
      longDescription: product.description || product.shortDescription || product.name,
      shortDescription: product.shortDescription || product.name,
      existingImageUrl: referenceImageUrl ?? '',
    }

    const prompts = getPromptsForImageCount(context, existingCount)
    if (prompts.length === 0) continue

    const results = await generateMultipleProductImages(prompts, referenceImageUrl)

    let savedCount = 0
    const errors: string[] = []

    for (const result of results) {
      if (result.success && result.imageUrl) {
        await prisma.productImage.create({
          data: {
            productId: product.id,
            imageUrl: result.imageUrl,
            altText: `${product.name} – AI generated`,
            isPrimary: false,
            sortOrder: existingCount + savedCount,
          },
        })
        savedCount++
        totalGenerated++
      } else if (result.error) {
        errors.push(result.error)
      }
    }

    summary.push({ productId: product.id, productName: product.name, generated: savedCount, errors })

    // Pause between products to be polite to the API
    await new Promise((r) => setTimeout(r, 500))
  }

  return NextResponse.json({
    success: true,
    message: `Processed ${productsNeedingImages.length} products, generated ${totalGenerated} images`,
    processed: productsNeedingImages.length,
    totalGenerated,
    results: summary,
  })
}
