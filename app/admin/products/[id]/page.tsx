import { createClient } from "@/lib/supabase/server"
import { AdminHeader } from "@/components/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ProductEditor } from "@/components/product-editor"
import { StockAdjuster } from "@/components/stock-adjuster"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"

export default async function AdminProductDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/admin/products")
  }

  const { data: adminUser } = await supabase.from("admin_users").select("*").eq("id", user.id).single()

  if (!adminUser) {
    redirect("/")
  }

  const { data: product } = await supabase
    .from("products")
    .select(
      `
      *,
      category:categories(name, id),
      images:product_images(*)
    `,
    )
    .eq("id", params.id)
    .single()

  if (!product) {
    notFound()
  }

  const { data: categories } = await supabase.from("categories").select("*").order("name")

  const { data: inventoryLogs } = await supabase
    .from("inventory_logs")
    .select("*")
    .eq("product_id", product.id)
    .order("created_at", { ascending: false })
    .limit(10)

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
              <Badge variant={product.is_active ? "secondary" : "destructive"}>
                {product.is_active ? "Active" : "Inactive"}
              </Badge>
              {product.is_featured && <Badge>Featured</Badge>}
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {/* Product Editor */}
              <Card>
                <CardHeader>
                  <CardTitle>Product Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProductEditor product={product} categories={categories || []} />
                </CardContent>
              </Card>

              {/* Inventory History */}
              <Card>
                <CardHeader>
                  <CardTitle>Inventory History</CardTitle>
                </CardHeader>
                <CardContent>
                  {inventoryLogs && inventoryLogs.length > 0 ? (
                    <div className="space-y-3">
                      {inventoryLogs.map((log) => (
                        <div key={log.id} className="flex items-center justify-between rounded-lg border p-3">
                          <div>
                            <p className="text-sm font-medium capitalize">{log.change_type}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(log.created_at).toLocaleDateString("en-IN", { dateStyle: "long" })}
                            </p>
                            {log.reason && <p className="text-xs text-muted-foreground">{log.reason}</p>}
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${log.quantity_change > 0 ? "text-green-600" : "text-red-600"}`}>
                              {log.quantity_change > 0 ? "+" : ""}
                              {log.quantity_change}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {log.quantity_before} → {log.quantity_after}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-sm text-muted-foreground">No inventory history</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {/* Stock Management */}
              <Card>
                <CardHeader>
                  <CardTitle>Stock Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <StockAdjuster
                    productId={product.id}
                    currentStock={product.stock_quantity}
                    adminUserId={adminUser.id}
                  />
                </CardContent>
              </Card>

              {/* Product Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Product Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">SKU</p>
                    <p className="font-mono font-medium">{product.sku}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Current Stock</p>
                    <p className="text-2xl font-bold">{product.stock_quantity}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Low Stock Threshold</p>
                    <p className="font-medium">{product.low_stock_threshold}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Price</p>
                    <p className="font-bold">₹{Number(product.price).toLocaleString("en-IN")}</p>
                  </div>
                  {product.compare_at_price && (
                    <div>
                      <p className="text-sm text-muted-foreground">Compare at Price</p>
                      <p className="font-medium">₹{Number(product.compare_at_price).toLocaleString("en-IN")}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
