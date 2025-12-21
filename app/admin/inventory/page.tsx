import { createClient } from "@/lib/supabase/server"
import { AdminHeader } from "@/components/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, Package } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function AdminInventoryPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/admin/inventory")
  }

  const { data: adminUser } = await supabase.from("admin_users").select("*").eq("id", user.id).single()

  if (!adminUser) {
    redirect("/")
  }

  const { data: products } = await supabase
    .from("products")
    .select("*, category:categories(name)")
    .order("stock_quantity", { ascending: true })

  const { data: recentLogs } = await supabase
    .from("inventory_logs")
    .select(
      `
      *,
      product:products(name),
      admin:admin_users(id)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(10)

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <AdminHeader />
      <main className="flex-1 px-6 py-8">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold tracking-tight">Inventory Management</h1>
              <p className="text-muted-foreground">Track and manage product stock levels</p>
            </div>
            <Button asChild>
              <Link href="/admin/products/new">Add New Product</Link>
            </Button>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {/* Products List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Product Stock Levels
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {products?.map((product) => {
                      const isLowStock = product.stock_quantity <= product.low_stock_threshold
                      const isOutOfStock = product.stock_quantity <= 0

                      return (
                        <Link key={product.id} href={`/admin/products/${product.id}`}>
                          <div className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted">
                            <div className="flex-1">
                              <p className="font-semibold">{product.name}</p>
                              <p className="text-sm text-muted-foreground">{product.category?.name}</p>
                              <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold">{product.stock_quantity}</span>
                                {isOutOfStock ? (
                                  <Badge variant="destructive">Out of Stock</Badge>
                                ) : isLowStock ? (
                                  <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                                    Low Stock
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">In Stock</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentLogs?.slice(0, 5).map((log) => (
                      <div key={log.id} className="rounded-lg border p-3">
                        <p className="text-sm font-medium">{log.product?.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {log.change_type}: {log.quantity_change > 0 ? "+" : ""}
                          {log.quantity_change} units
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleDateString("en-IN", { dateStyle: "short" })}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Stock Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    Stock Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Out of Stock</span>
                      <span className="font-bold text-destructive">
                        {products?.filter((p) => p.stock_quantity <= 0).length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Low Stock</span>
                      <span className="font-bold text-yellow-600">
                        {products?.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold)
                          .length || 0}
                      </span>
                    </div>
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
