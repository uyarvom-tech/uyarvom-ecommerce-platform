import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAccess } from '@/lib/auth-middleware'
import { getPromptsForImageCount } from '@/lib/prompts/image-generation'
import { generateMultipleProductImages } from '@/lib/gemini-client'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireStaffAccess(request)
  if (authCheck instanceof NextResponse) return authCheck

  const { id } = await params

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
      productCategories: {
        include: { category: true },
      },
    },
  })

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  const existingCount = product.images.length

  if (existingCount >= 4) {
    return NextResponse.json({ success: true, message: 'Product already has maximum images', generated: 0 })
  }

  const primaryCategory =
    product.productCategories.find((pc) => pc.isPrimary)?.category ??
    product.productCategories[0]?.category

  if (!primaryCategory) {
    return NextResponse.json({ error: 'Product must have at least one category' }, { status: 400 })
  }

  const referenceImageUrl = product.images[0]?.imageUrl ?? undefined

  const context = {
    category: primaryCategory.name,
    productName: product.name,
    longDescription: product.description || product.shortDescription || product.name,
    shortDescription: product.shortDescription || product.name,
    existingImageUrl: referenceImageUrl ?? '',
  }

  const prompts = getPromptsForImageCount(context, existingCount)

  if (prompts.length === 0) {
    return NextResponse.json({ success: true, message: 'No images needed', generated: 0 })
  }

  const results = await generateMultipleProductImages(prompts, referenceImageUrl)

  // Persist successful images to DB
  let savedCount = 0
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
    }
  }

  const errors = results.filter((r) => !r.success).map((r) => r.error)

  return NextResponse.json({
    success: savedCount > 0 || prompts.length === 0,
    message: `Generated and saved ${savedCount} image(s)`,
    generated: savedCount,
    total: existingCount + savedCount,
    errors: errors.length ? errors : undefined,
  })
}
