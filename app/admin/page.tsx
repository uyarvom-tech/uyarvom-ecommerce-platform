import { prisma } from "@/lib/prisma"
import { AdminHeader } from "@/components/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Package,
  ShoppingCart,
  TrendingUp,
  Eye,
  Plus,
  Settings,
  ArrowUpRight,
  Clock,
  ChevronRight,
  AlertCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getVariantStockSummary } from "@/lib/variant-stock"

export const dynamic = "force-dynamic"

export default async function AdminDashboard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login?redirect=/admin")

  const admin = await prisma.adminUser.findUnique({ where: { userId: user.id } })
  if (!admin) redirect("/")

  const [stats, recentOrders, topProductSales] = await Promise.all([
    // Batch all stats queries together
    Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.order.count({ where: { status: "pending" } }),
      prisma.order.aggregate({ _sum: { total: true } }),
    ]),
    // Recent orders
    prisma.order.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderNumber: true,
        total: true,
        status: true,
        createdAt: true,
        shippingName: true,
      },
    }),
    // Top products by sales
    prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 4,
    }),
  ])

  const [totalProducts, activeProducts, totalOrders, pendingOrders, totalRevenue] = stats

  // Calculate low stock count (moved after top products to batch queries)
  const inventoryProducts = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      lowStockThreshold: true,
      colors: {
        select: {
          variants: {
            select: {
              stock: true,
              isActive: true,
              sortOrder: true,
            },
          },
        },
      },
    },
  })

  const lowStockCount = inventoryProducts.filter((product) => {
    const summary = getVariantStockSummary(product as any)
    const threshold = Number(product.lowStockThreshold ?? 10)
    return summary.total > 0 && summary.total <= threshold
  }).length

  const topProductIds = topProductSales.map((item) => item.productId)
  const topProducts = topProductIds.length
    ? await prisma.product.findMany({
        where: { id: { in: topProductIds } },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
        },
      })
    : []

  const topProductsBySales = topProductIds
    .map((productId) => {
      const product = topProducts.find((item) => item.id === productId)
      const sales = topProductSales.find((item) => item.productId === productId)

      if (!product || !sales) {
        return null
      }

      return {
        ...product,
        soldQuantity: sales._sum.quantity || 0,
      }
    })
    .filter(Boolean)

  return (
    <div className="flex min-h-screen flex-col bg-muted/10">
      <AdminHeader />
      <main className="flex-1 px-8 py-10">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
              <h1 className="text-6xl font-black tracking-tighter uppercase mb-2">Admin Dashboard</h1>
              <p className="text-muted-foreground text-sm font-bold uppercase tracking-[.3em]">
                Orders, products, stock, and support
              </p>
            </div>

            <div className="flex bg-black text-white p-2 rounded-none gap-4">
              <div className="px-6 py-2 border-r border-white/10 text-center">
                <p className="text-[8px] font-bold uppercase tracking-widest text-gray-500 mb-1">Status</p>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase">Online</span>
                </div>
              </div>
              <div className="px-6 py-2 text-center">
                <p className="text-[8px] font-bold uppercase tracking-widest text-gray-500 mb-1">Role</p>
                <span className="text-[10px] font-black uppercase">{admin.role === "super_admin" ? "Super Admin" : "Admin"}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
            {[
              {
                label: "Revenue",
                value: `Rs.${(totalRevenue._sum.total || 0).toLocaleString("en-IN")}`,
                icon: TrendingUp,
                color: "text-green-600",
                note: "Total sales",
              },
              { label: "Pending Orders", value: pendingOrders, icon: ShoppingCart, color: "text-blue-600", note: "Needs action" },
              { label: "Products", value: totalProducts, icon: Package, color: "text-black", note: `${activeProducts} active` },
              { label: "Low Stock", value: lowStockCount, icon: AlertCircle, color: "text-red-600", note: "Needs restock", alert: lowStockCount > 0 },
            ].map((stat, i) => (
              <Card key={i} className="rounded-none border-none shadow-sm overflow-hidden group hover:shadow-xl transition-all">
                <CardContent className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-muted group-hover:bg-black group-hover:text-white transition-colors">
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{stat.label}</p>
                  <h3 className={`text-3xl font-black italic tracking-tighter ${stat.alert ? "text-red-600" : "text-black"}`}>
                    {stat.value}
                  </h3>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-4 opacity-60 group-hover:opacity-100 transition-opacity">
                    {stat.note}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-10">
              <Card className="rounded-none border-none shadow-sm h-full">
                <CardHeader className="border-b bg-muted/5 py-6">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xs font-black uppercase tracking-[.2em] flex items-center gap-2">
                      <Clock className="h-4 w-4" /> Recent Orders
                    </CardTitle>
                    <Link href="/admin/orders" className="text-[9px] font-bold uppercase tracking-widest hover:underline">
                      View All
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-black/5">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-6 hover:bg-muted/5 transition-colors group">
                        <div className="flex items-center gap-6">
                          <div className="h-12 w-12 bg-black text-white flex items-center justify-center text-[10px] font-black italic">
                            ORD
                          </div>
                          <div>
                            <p className="font-black text-sm uppercase tracking-tight">
                              #{order.orderNumber} - {order.shippingName}
                            </p>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1 tracking-widest">
                              {new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-10">
                          <div className="text-right">
                            <p className="text-sm font-black italic">Rs.{order.total.toLocaleString("en-IN")}</p>
                            <Badge variant="outline" className="rounded-none text-[8px] font-black px-2 mt-1 uppercase border-black/10">
                              {order.status}
                            </Badge>
                          </div>
                          <Link href={`/admin/orders/${order.id}`}>
                            <button className="p-2 border border-transparent group-hover:border-black transition-all">
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-10">
              <Card className="rounded-none border-none shadow-sm bg-black text-white p-8 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Settings className="h-16 w-16" />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-[.25em] mb-10 pb-4 border-b border-white/10">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <Button asChild className="w-full justify-between bg-white text-black hover:bg-white/90 rounded-none h-12 text-[10px] font-black uppercase tracking-widest px-6">
                    <Link href="/admin/catalog/new">
                      Add Category
                      <Plus className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-between border-white/20 text-white hover:bg-white hover:text-black rounded-none h-12 text-[10px] font-black uppercase tracking-widest px-6">
                    <Link href="/admin/products/new">
                      Add Product
                      <Package className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-between border-white/20 text-white hover:bg-white hover:text-black rounded-none h-12 text-[10px] font-black uppercase tracking-widest px-6">
                    <Link href="/admin/support">
                      View Support
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>

                <div className="mt-10 pt-8 border-t border-white/10 text-center">
                  <p className="text-[9px] font-bold uppercase tracking-[.3em] text-gray-500 mb-4 italic">Internal Maintenance System</p>
                  <button className="text-[9px] font-black uppercase tracking-widest underline decoration-white/20 hover:decoration-white">
                    Rebuild System Cache
                  </button>
                </div>
              </Card>

              <Card className="rounded-none border-none shadow-sm">
                <CardHeader className="border-b bg-muted/5 py-6">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest">Top Products</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {topProductsBySales.length > 0 ? (
                      topProductsBySales.map((product: any) => (
                        <Link 
                          key={product.id} 
                          href={`/admin/products/${product.id}/edit`} 
                          prefetch={false}
                          className="flex items-center gap-4 group"
                        >
                          <div className="h-12 w-12 bg-muted p-1 overflow-hidden shrink-0">
                            {product.images[0] && (
                              <img
                                src={product.images[0].imageUrl}
                                alt=""
                                className="h-full w-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black uppercase tracking-tight truncate">{product.name}</p>
                            <p className="text-[10px] font-bold text-muted-foreground">Rs.{product.price.toLocaleString()}</p>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                              {product.soldQuantity} sold
                            </p>
                          </div>
                          <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      ))
                    ) : (
                      <div className="rounded-none border border-dashed border-black/10 p-6 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          No completed sales yet
                        </p>
                      </div>
                    )}
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
