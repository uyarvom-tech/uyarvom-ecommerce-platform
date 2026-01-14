import { prisma } from "@/lib/prisma-safe"
import { AdminHeader } from "@/components/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Package, 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  Eye,
  Plus,
  BarChart3,
  Settings
} from "lucide-react"
import Link from "next/link"

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminDashboard() {
  // Get dashboard statistics
  const [
    totalProducts,
    activeProducts,
    totalCategories,
    lowStockProducts
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.category.count(),
    prisma.product.count({ where: { stockQuantity: { lte: 10 } } })
  ])

  // Get recent products
  const recentProducts = await prisma.product.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      productCategories: {
        include: { category: true },
        where: { isPrimary: true },
        take: 1
      },
      images: {
        where: { isPrimary: true },
        take: 1
      }
    }
  })

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <AdminHeader />
      <main className="flex-1 px-6 py-8">
        <div className="container mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">Welcome to your store management console</p>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalProducts}</div>
                <p className="text-xs text-muted-foreground">
                  {activeProducts} active products
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Categories</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalCategories}</div>
                <p className="text-xs text-muted-foreground">
                  Product categories
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
                <TrendingUp className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{lowStockProducts}</div>
                <p className="text-xs text-muted-foreground">
                  Products need restocking
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Store Status</CardTitle>
                <Eye className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Live</div>
                <p className="text-xs text-muted-foreground">
                  Store is operational
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Recent Products */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button asChild className="w-full justify-start">
                  <Link href="/admin/catalog">
                    <Plus className="mr-2 h-4 w-4" />
                    Manage Catalog
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/admin/products/new">
                    <Package className="mr-2 h-4 w-4" />
                    Add New Product
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/admin/orders">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View Orders
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/?admin=true">
                    <Eye className="mr-2 h-4 w-4" />
                    Customer View
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Recent Products */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentProducts.map((product: any) => (
                    <div key={product.id} className="flex items-center space-x-4">
                      <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-muted">
                        {product.images[0] && (
                          <img
                            src={product.images[0].imageUrl}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {product.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {product.productCategories[0]?.category?.name || 'No Category'} • ₹{product.price.toLocaleString()}
                        </p>
                      </div>
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={`/admin/products/${product.id}/edit`}>
                          <Settings className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  ))}
                  {recentProducts.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No products yet. Create your first product!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
