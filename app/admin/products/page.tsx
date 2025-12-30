import { prisma } from "@/lib/prisma"
import { AdminHeader } from "@/components/admin-header"
import { ProductManagement } from "@/components/admin/product-management"

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; category?: string; status?: string }>
}) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const limit = 10
  const skip = (page - 1) * limit

  // Build where clause for filtering
  const where: any = {}
  
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { sku: { contains: params.search, mode: 'insensitive' } }
    ]
  }
  
  if (params.category && params.category !== 'all') {
    where.productCategories = {
      some: {
        categoryId: params.category
      }
    }
  }
  
  if (params.status === 'active') {
    where.isActive = true
  } else if (params.status === 'inactive') {
    where.isActive = false
  }

  // Get products and categories
  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        productCategories: {
          include: { category: true },
          orderBy: { isPrimary: 'desc' }
        },
        images: {
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({
      orderBy: { displayOrder: 'asc' }
    })
  ])

  const pagination = {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  }

  // Transform products to include categories array for compatibility
  const transformedProducts = products.map(product => ({
    ...product,
    categories: product.productCategories.map(pc => pc.category),
    primaryCategory: product.productCategories.find(pc => pc.isPrimary)?.category || product.productCategories[0]?.category,
    // Keep backward compatibility
    category: product.productCategories.find(pc => pc.isPrimary)?.category || product.productCategories[0]?.category
  }))

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <AdminHeader />
      <main className="flex-1 px-6 py-8">
        <div className="container mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Product Management</h1>
            <p className="text-muted-foreground">Manage your store's products, inventory, and pricing</p>
          </div>
          <ProductManagement 
            initialProducts={transformedProducts}
            categories={categories}
            pagination={pagination}
          />
        </div>
      </main>
    </div>
  )
}
