import { prisma } from '@/lib/prisma'
import { AdminHeader } from '@/components/admin-header'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MediaLibraryClient } from '@/components/admin/media-library-client'

export const dynamic = 'force-dynamic'

export default async function MediaLibraryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?redirect=/admin/media')

  const admin = await prisma.adminUser.findUnique({ where: { userId: user.id } })
  if (!admin) redirect('/')

  // Fetch all product images grouped by product
  const products = await prisma.product.findMany({
    where: {
      images: { some: {} },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      sku: true,
      images: {
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          imageUrl: true,
          altText: true,
          isPrimary: true,
          sortOrder: true,
          createdAt: true,
        },
      },
      colors: {
        select: {
          colorName: true,
          images: {
            orderBy: { sortOrder: 'asc' },
            select: {
              id: true,
              imageUrl: true,
              altText: true,
              isPrimary: true,
              sortOrder: true,
              createdAt: true,
            },
          },
        },
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  // Flatten all images with product context
  const allImages = products.flatMap((product) => {
    const colorImages = product.colors.flatMap((color) =>
      color.images.map((img) => ({
        ...img,
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        productSku: product.sku,
        colorName: color.colorName,
      }))
    )

    // Direct product images (not associated with a color)
    const directImages = product.images
      .filter((img) => !colorImages.some((ci) => ci.id === img.id))
      .map((img) => ({
        ...img,
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        productSku: product.sku,
        colorName: null,
      }))

    return [...colorImages, ...directImages]
  })

  const totalCount = allImages.length

  return (
    <div className="flex min-h-screen flex-col bg-muted/10">
      <AdminHeader userRole={admin.role} />
      <main className="flex-1 px-8 py-10">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Media Library</h1>
            <p className="text-muted-foreground">
              Browse and manage all product images • {totalCount} total images
            </p>
          </div>
          <MediaLibraryClient images={allImages} />
        </div>
      </main>
    </div>
  )
}
