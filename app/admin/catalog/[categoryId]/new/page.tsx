import { prisma } from "@/lib/prisma"
import { AdminHeader } from "@/components/admin-header"
import { ProductForm } from "@/components/admin/product-form"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface NewProductPageProps {
  params: Promise<{ categoryId: string }>
}

export default async function NewProductPage({ params }: NewProductPageProps) {
  const { categoryId } = await params

  // Fetch the category to ensure it exists
  const category = await prisma.category.findUnique({
    where: { id: categoryId }
  })

  if (!category) {
    notFound()
  }

  // Fetch all categories for the form
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: [
      { displayOrder: 'asc' },
      { name: 'asc' }
    ]
  })

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AdminHeader />
      
      <main className="flex-1 container mx-auto px-6 py-8 max-w-4xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/catalog/${categoryId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to {category.name}
            </Link>
          </Button>
          <div className="h-6 w-px bg-border" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Add New Product</h1>
            <p className="text-muted-foreground">
              Create a new product in the {category.name} category
            </p>
          </div>
        </div>

        {/* Product Form */}
        <ProductForm 
          categories={categories}
          defaultCategoryId={categoryId}
          redirectPath={`/admin/catalog/${categoryId}`}
        />
      </main>
    </div>
  )
}