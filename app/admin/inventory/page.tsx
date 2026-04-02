import { prisma } from "@/lib/prisma"
import { AdminHeader } from "@/components/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Package, TrendingDown, RefreshCw, ChevronRight } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { getCurrentUserContext } from "@/lib/auth-middleware"
import { InventoryReplenishButton } from "@/components/admin/inventory-replenish-button"

export const dynamic = 'force-dynamic'

export default async function AdminInventoryPage() {
  const context = await getCurrentUserContext()

  if (!context) {
    redirect("/auth/login?redirect=/admin/inventory")
  }

  if (!["admin", "staff", "super_admin"].includes(context.role)) {
    redirect("/")
  }

  const products = await prisma.product.findMany({
    include: {
      productCategories: {
        include: { category: true },
        orderBy: { isPrimary: 'desc' },
      },
      colors: {
        orderBy: { sortOrder: 'asc' },
        include: {
          variants: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      },
    },
    orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
  })

  const auditLogs = await prisma.auditLog.findMany({
    where: { action: { in: ["stock_adjustment", "variant_stock_update"] } },
    include: { actor: true },
    orderBy: { createdAt: 'desc' },
    take: 10
  })

  const inventoryRows = products
    .map((product) => {
      const variants = product.colors.flatMap((color) =>
        color.variants.map((variant) => ({
          id: variant.id,
          colorName: color.colorName,
          size: variant.size || variant.value || variant.name || 'Size',
          stock: Number(variant.stock || 0),
          threshold: product.lowStockThreshold,
        }))
      )

      const totalStock = variants.reduce((sum, variant) => sum + variant.stock, 0)
      const lowVariants = variants.filter((variant) => variant.stock > 0 && variant.stock <= variant.threshold)
      const outOfStockVariants = variants.filter((variant) => variant.stock <= 0)

      return {
        ...product,
        variants,
        totalStock,
        lowVariants,
        outOfStockVariants,
        primaryCategory: product.productCategories[0]?.category,
      }
    })
    .sort((a, b) => a.totalStock - b.totalStock)

  const outOfStock = inventoryRows.filter((product) => product.totalStock <= 0).length
  const lowStock = inventoryRows.filter((product) => product.totalStock > 0 && product.totalStock <= product.lowStockThreshold).length

  return (
    <div className="flex min-h-screen flex-col bg-muted/10">
      <AdminHeader />
      <main className="flex-1 px-8 py-10">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <h1 className="text-4xl font-black tracking-tight mb-2 uppercase">Stock Governance</h1>
              <p className="text-muted-foreground text-sm uppercase tracking-widest font-bold">Monitor and synchronize physical inventory levels</p>
            </div>
            <Link href="/admin/products/new" className="bg-black text-white px-8 h-12 flex items-center text-[10px] font-bold uppercase tracking-widest hover:bg-black/90">
              Onboard New Product
            </Link>
          </div>

          <div className="grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-10">
              {/* Products Inventory List */}
              <Card className="rounded-none border-none shadow-sm">
                <CardHeader className="border-b bg-muted/5 py-6">
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    <Package className="h-4 w-4" /> SKU Inventory Matrix
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead>
                      <tr className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground border-b bg-muted/10">
                        <th className="px-6 py-4 text-left">Product / SKU</th>
                        <th className="px-6 py-4 text-center">Threshold</th>
                        <th className="px-6 py-4 text-center">Variant Stock</th>
                        <th className="px-6 py-4 text-left">Low Variants</th>
                        <th className="px-6 py-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {inventoryRows.map((product) => {
                        const isLow = product.totalStock <= product.lowStockThreshold && product.totalStock > 0
                        const isOut = product.totalStock <= 0
                        return (
                          <tr key={product.id} className="hover:bg-muted/5 transition-colors group">
                            <td className="px-6 py-6">
                              <Link href={`/admin/products/${product.id}/edit`} className="font-bold hover:underline block">
                                {product.name}
                              </Link>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">SKU: {product.sku || product.id.slice(0, 8)}</p>
                                <span className="text-muted-foreground/30">•</span>
                                <p className="text-[10px] text-muted-foreground uppercase">{product.primaryCategory?.name || 'Uncategorized'}</p>
                                <span className="text-muted-foreground/30">•</span>
                                <p className="text-[10px] text-muted-foreground uppercase">{product.variants.length} variants</p>
                              </div>
                            </td>
                            <td className="px-6 py-6 text-center text-xs font-mono opacity-50">{product.lowStockThreshold}</td>
                            <td className="px-6 py-6 text-center">
                              <span className={`text-lg font-black ${isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-black'}`}>
                                {product.totalStock}
                              </span>
                            </td>
                            <td className="px-6 py-6 text-left">
                              {product.lowVariants.length > 0 ? (
                                <div className="space-y-1">
                                  {product.lowVariants.slice(0, 3).map((variant) => (
                                    <div key={variant.id} className="text-[10px] uppercase font-bold tracking-widest text-amber-700">
                                      {variant.colorName} / {variant.size} - {variant.stock}
                                    </div>
                                  ))}
                                  {product.lowVariants.length > 3 && (
                                    <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                                      +{product.lowVariants.length - 3} more
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/50">None</span>
                              )}
                            </td>
                            <td className="px-6 py-6 text-right">
                              <Badge variant="outline" className={`rounded-none px-3 py-1 text-[9px] font-black uppercase tracking-widest ${isOut ? 'bg-red-50 text-red-700 border-red-200' : isLow ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                                {isOut ? 'Void' : isLow ? 'Low' : 'Optimal'}
                              </Badge>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-10">
              {/* Stock Alerts Card */}
              <Card className="rounded-none border-none bg-black text-white p-8 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-24 h-24 opacity-5 pointer-events-none">
                  <AlertCircle className="w-full h-full" />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-[.3em] mb-8 pb-4 border-b border-white/10 flex items-center justify-between relative z-10">
                  CRITICAL ALERTS
                </h3>
                <div className="space-y-6 relative z-10">
                  <div className="flex justify-between items-center bg-white/5 p-4 border-l-2 border-red-500">
                    <div>
                      <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">Out of Stock</p>
                      <p className="text-2xl font-black">{outOfStock}</p>
                    </div>
                    <TrendingDown className="h-8 w-8 text-red-500 opacity-50" />
                  </div>
                  <div className="flex justify-between items-center bg-white/5 p-4 border-l-2 border-amber-500">
                    <div>
                      <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">Low Inventory</p>
                      <p className="text-2xl font-black">{lowStock}</p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-amber-500 opacity-50" />
                  </div>
                </div>
                <div className="mt-10">
                  <InventoryReplenishButton />
                </div>
              </Card>

              {/* Activity Feed */}
              <Card className="rounded-none border-none shadow-sm">
                <CardHeader className="border-b bg-muted/5 py-4 px-6 flex flex-row justify-between items-center">
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest">Adjustment Feed</CardTitle>
                  <RefreshCw className="h-3 w-3 text-muted-foreground cursor-pointer hover:rotate-180 transition-transform duration-500" />
                </CardHeader>
                <CardContent className="px-0 py-2">
                  <div className="divide-y">
                    {auditLogs.map(log => (
                      <div key={log.id} className="px-6 py-4 hover:bg-muted/5">
                        <p className="text-xs font-bold leading-tight line-clamp-2">{log.description}</p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-[9px] uppercase font-bold text-muted-foreground opacity-60">{log.actor?.fullName || 'Admin'}</span>
                          <span className="text-[9px] uppercase font-bold text-muted-foreground opacity-60">{new Date(log.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                    {auditLogs.length === 0 && (
                      <p className="p-8 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-40">No recent adjustments</p>
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
