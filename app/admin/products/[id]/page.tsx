import { AdminHeader } from "@/components/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { VariantStockManager } from "@/components/admin/variant-stock-manager"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma-safe"
import { getCurrentUserContext } from "@/lib/auth-middleware"

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminProductDetailPage({ params }: { params: { id: string } }) {
  const context = await getCurrentUserContext()

  if (!context) {
    redirect("/auth/login?redirect=/admin/products")
  }

  if (!["admin", "staff", "super_admin"].includes(context.role)) {
    redirect("/")
  }

  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      productCategories: {
        include: { category: true },
        orderBy: { isPrimary: "desc" },
      },
      images: {
        orderBy: { sortOrder: "asc" },
      },
      colors: {
        orderBy: { sortOrder: "asc" },
        include: {
          images: {
            orderBy: { sortOrder: "asc" },
          },
          variants: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  })

  if (!product) {
    notFound()
  }

  const totalVariantStock = product.colors.reduce((sum, color) => {
    return (
      sum +
      color.variants.reduce((variantSum, variant) => {
        return variantSum + Number(variant.stock || 0)
      }, 0)
    )
  }, 0)

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <AdminHeader />
      <main className="flex-1 px-6 py-8">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-6">
            <Link href="/admin/products" className="text-sm text-muted-foreground hover:text-foreground">
              ← Back to Products
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold tracking-tight">{product.name}</h1>
            <div className="flex items-center gap-2">
              <Badge variant={product.isActive ? "secondary" : "destructive"}>
                {product.isActive ? "Active" : "Inactive"}
              </Badge>
              {product.isFeatured && <Badge>Featured</Badge>}
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Variant Stock Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <VariantStockManager
                    productId={product.id}
                    colors={product.colors.map((color) => ({
                      id: color.id,
                      colorName: color.colorName,
                      colorCode: color.colorCode,
                      variants: color.variants.map((variant) => ({
                        id: variant.id,
                        size: variant.size || variant.value || variant.name || null,
                        stock: variant.stock,
                        price: variant.price,
                        sku: variant.sku,
                        isActive: variant.isActive,
                        sortOrder: variant.sortOrder,
                      })),
                    }))}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Product Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <p className="text-sm text-muted-foreground">SKU</p>
                    <p className="font-mono font-medium">{product.sku}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Variant Stock Total</p>
                    <p className="text-2xl font-bold">{totalVariantStock}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Low Stock Threshold</p>
                    <p className="font-medium">{product.lowStockThreshold}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Price</p>
                    <p className="font-bold">₹{Number(product.price).toLocaleString("en-IN")}</p>
                  </div>
                  {product.compareAtPrice && (
                    <div>
                      <p className="text-sm text-muted-foreground">Compare at Price</p>
                      <p className="font-medium">₹{Number(product.compareAtPrice).toLocaleString("en-IN")}</p>
                    </div>
                  )}
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Colors</p>
                    <p className="font-medium">{product.colors.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Size Variants</p>
                    <p className="font-medium">
                      {product.colors.reduce((sum, color) => sum + color.variants.length, 0)}
                    </p>
                  </div>
                  <div className="pt-2">
                    <Button asChild className="w-full">
                      <Link href={`/admin/products/${product.id}/edit`}>Edit Product Details</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
