import { prisma } from "@/lib/prisma-safe"
import { AdminHeader } from "@/components/admin-header"
import { ProductForm } from "@/components/admin/product-form"

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function NewProductPage() {
  // Get categories with hierarchy for the form
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    include: {
      children: {
        where: { isActive: true },
        orderBy: [
          { displayOrder: 'asc' },
          { name: 'asc' }
        ]
      }
    },
    orderBy: [
      { displayOrder: 'asc' },
      { name: 'asc' }
    ]
  })

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <AdminHeader />
      <main className="flex-1 px-6 py-8">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Add New Product</h1>
            <p className="text-muted-foreground">Create a new product for your store</p>
          </div>
          <ProductForm categories={categories} />
        </div>
      </main>
    </div>
  )
}
