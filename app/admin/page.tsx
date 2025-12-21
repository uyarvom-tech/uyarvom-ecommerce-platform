import { createClient } from "@/lib/supabase/server"
import { AdminHeader } from "@/components/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, ShoppingCart, DollarSign, TrendingUp, AlertCircle } from "lucide-react"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/admin")
  }

  const { data: adminUser } = await supabase.from("admin_users").select("*").eq("id", user.id).single()

  if (!adminUser) {
    redirect("/")
  }

  // Get statistics
  const { count: totalOrders } = await supabase.from("orders").select("*", { count: "exact", head: true })

  const { count: pendingOrders } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")

  const { count: totalProducts } = await supabase.from("products").select("*", { count: "exact", head: true })

  const { count: lowStockProducts } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .lte("stock_quantity", 10)

  const { data: recentOrders } = await supabase
    .from("orders")
    .select("*, profiles(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(5)

  // Calculate total revenue
  const { data: allOrders } = await supabase.from("orders").select("total").in("status", ["delivered", "shipped"])

  const totalRevenue = allOrders?.reduce((sum, order) => sum + Number(order.total), 0) || 0

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <AdminHeader />
      <main className="flex-1 px-6 py-8">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {adminUser.role}</p>
          </div>

          {/* Stats Grid */}
          <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString("en-IN")}</div>
                <p className="text-xs text-muted-foreground">From completed orders</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalOrders}</div>
                <p className="text-xs text-muted-foreground">{pendingOrders} pending</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalProducts}</div>
                <p className="text-xs text-muted-foreground">{lowStockProducts} low stock</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Growth</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+12.5%</div>
                <p className="text-xs text-muted-foreground">From last month</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Orders</CardTitle>
                  <Link href="/admin/orders" className="text-sm text-primary hover:underline">
                    View all
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders?.map((order) => (
                    <Link key={order.id} href={`/admin/orders/${order.id}`}>
                      <div className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted">
                        <div>
                          <p className="font-medium">#{order.order_number}</p>
                          <p className="text-sm text-muted-foreground">{order.profiles?.full_name || "Guest"}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">₹{Number(order.total).toLocaleString("en-IN")}</p>
                          <p className="text-xs text-muted-foreground capitalize">{order.status}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Low Stock Alert */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    Low Stock Alerts
                  </CardTitle>
                  <Link href="/admin/products" className="text-sm text-primary hover:underline">
                    View all
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {lowStockProducts === 0 ? (
                  <p className="text-center text-sm text-muted-foreground">All products are well stocked</p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {lowStockProducts} {lowStockProducts === 1 ? "product needs" : "products need"} restocking
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
