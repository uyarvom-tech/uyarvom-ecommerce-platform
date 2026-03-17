import { prisma } from "@/lib/prisma"
import { AdminHeader } from "@/components/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { OrderStatusUpdater } from "@/components/order-status-updater"
import { OrderTimeline } from "@/components/order-timeline"
import { Package, MapPin, User, ChevronLeft, CreditCard, Truck, AlertCircle } from "lucide-react"
import { notFound, redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { PRODUCT_FALLBACK_IMAGE } from "@/lib/image-fallbacks"

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
  confirmed: "bg-blue-500/10 text-blue-700 border-blue-200",
  processing: "bg-purple-500/10 text-purple-700 border-purple-200",
  shipped: "bg-indigo-500/10 text-indigo-700 border-indigo-200",
  delivered: "bg-green-500/10 text-green-700 border-green-200",
  cancelled: "bg-red-500/10 text-red-700 border-red-200",
}

export const dynamic = 'force-dynamic'

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/admin/orders")
  }

  const admin = await prisma.adminUser.findUnique({ where: { userId: user.id } })
  if (!admin) redirect("/")

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      orderItems: {
        include: {
          product: {
            include: {
              images: { where: { isPrimary: true }, take: 1 }
            }
          }
        }
      },
      user: true,
      events: { orderBy: { createdAt: 'desc' } }
    }
  }) as any

  if (!order) notFound()

  return (
    <div className="flex min-h-screen flex-col bg-muted/10">
      <AdminHeader />
      <main className="flex-1 px-8 py-10">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-8">
            <Link href="/admin/orders" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-black transition-colors">
              <ChevronLeft className="h-4 w-4" /> Back to Orders
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row justify-between items-start gap-12 mb-12">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <h1 className="text-5xl font-black tracking-tight uppercase">Order #{order.orderNumber}</h1>
                <Badge variant="outline" className={`${statusColors[order.status]} rounded-none px-4 py-1.5 text-[10px] font-black uppercase tracking-widest`}>
                  {order.status}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <span>Placed: {new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" })}</span>
                <span>•</span>
                <span>Payment: <span className="text-black">{order.paymentMethod.replace('_', ' ')}</span></span>
                <span>•</span>
                <span>Status: <span className="text-black">{order.paymentStatus}</span></span>
              </div>
            </div>

            <div className="flex gap-4">
              <button className="bg-black text-white px-8 h-12 text-[10px] font-bold uppercase tracking-widest hover:bg-black/90">
                Print Invoice
              </button>
              {order.returnStatus === 'requested' && (
                <button className="bg-amber-500 text-white px-8 h-12 text-[10px] font-bold uppercase tracking-widest hover:bg-amber-600">
                  Process Return
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-10">
              {/* Items Table */}
              <Card className="rounded-none border-none shadow-sm">
                <CardHeader className="border-b bg-muted/5 py-6">
                  <CardTitle className="text-xs font-black uppercase tracking-[.2em] flex items-center gap-2">
                    <Package className="h-4 w-4" /> Shipments Items
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead>
                      <tr className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground border-b bg-muted/10">
                        <th className="px-6 py-4 text-left">Product</th>
                        <th className="px-6 py-4 text-center">Qty</th>
                        <th className="px-6 py-4 text-right">Price</th>
                        <th className="px-6 py-4 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {order.orderItems.map((item: any) => {
                        const primImg = item.product?.images?.[0]?.imageUrl || PRODUCT_FALLBACK_IMAGE
                        return (
                          <tr key={item.id} className="hover:bg-muted/5">
                            <td className="px-6 py-6">
                              <div className="flex items-center gap-4">
                                <div className="h-16 w-16 bg-muted shrink-0 overflow-hidden">
                                  <Image src={primImg} alt={item.productName} width={64} height={64} className="object-cover h-full w-full" />
                                </div>
                                <div>
                                  <p className="font-bold text-sm leading-tight">{item.productName}</p>
                                  <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">{item.variantName || 'Standard'}</p>
                                  <p className="text-[9px] text-muted-foreground opacity-60">SKU: {item.id.slice(0, 8)}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-6 text-center font-bold">{item.quantity}</td>
                            <td className="px-6 py-6 text-right font-medium">₹{item.price.toLocaleString("en-IN")}</td>
                            <td className="px-6 py-6 text-right font-black">₹{item.total.toLocaleString("en-IN")}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card className="rounded-none border-none shadow-sm">
                <CardHeader className="border-b bg-muted/5 py-6">
                  <CardTitle className="text-xs font-black uppercase tracking-[.2em] flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> Audit & Event Logs
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-10">
                  <OrderTimeline events={order.events} />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-10">
              {/* Status Update */}
              <Card className="rounded-none border-none shadow-sm overflow-hidden">
                <div className="bg-black text-white p-6">
                  <h3 className="text-xs font-black uppercase tracking-[.2em] flex items-center gap-2">
                    <Truck className="h-4 w-4 text-primary" /> FULFILLMENT CONTROL
                  </h3>
                </div>
                <CardContent className="p-8">
                  <OrderStatusUpdater
                    orderId={order.id}
                    currentStatus={order.status}
                    currentTrackingNumber={order.trackingNumber}
                    currentCourierName={order.courierName}
                  />
                </CardContent>
              </Card>

              {/* Customer Info */}
              <Card className="rounded-none border-none shadow-sm">
                <CardHeader className="border-b bg-muted/5 py-6">
                  <CardTitle className="text-xs font-black uppercase tracking-[.2em] flex items-center gap-2">
                    <User className="h-4 w-4" /> Distribution Intel
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Customer Profile</p>
                    <p className="font-bold text-lg">{order.shippingName}</p>
                    <p className="text-xs text-muted-foreground">{order.shippingEmail}</p>
                    <p className="text-xs text-muted-foreground mt-1">{order.shippingPhone}</p>
                  </div>

                  <div className="pt-6 border-t">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Shipping Destination</p>
                    <div className="space-y-1 text-sm">
                      <p className="font-medium">{order.shippingAddress1}</p>
                      {order.shippingAddress2 && <p>{order.shippingAddress2}</p>}
                      <p>{order.shippingCity}, {order.shippingState} {order.shippingZip}</p>
                      <p className="uppercase text-[10px] font-bold mt-2">{order.shippingCountry}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card className="rounded-none border-none bg-black text-white p-8">
                <h3 className="text-xs font-black uppercase tracking-[.2em] mb-8 pb-4 border-b border-white/10 flex items-center justify-between">
                  FINANCIAL SUMMARY
                  <CreditCard className="h-4 w-4 opacity-50" />
                </h3>
                <div className="space-y-4 text-xs font-bold uppercase tracking-widest">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal</span>
                    <span>₹{order.subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tax (IGST)</span>
                    <span>₹{order.tax.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Shipping</span>
                    <span>{order.shipping === 0 ? "FREE" : `₹${order.shipping.toLocaleString("en-IN")}`}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-primary">
                      <span>Discount</span>
                      <span>-₹{order.discount.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <div className="pt-4 border-t border-white/20 flex justify-between items-end">
                    <span className="text-white text-base">Grand Total</span>
                    <span className="text-3xl font-black italic tracking-tighter">₹{order.total.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-white/10">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Payment Method</p>
                      <p className="text-[11px] font-black uppercase">{order.paymentMethod.replace('_', ' ')}</p>
                    </div>
                    <Badge variant="outline" className="border-white/20 text-white rounded-none uppercase text-[9px] font-bold">
                      {order.paymentStatus}
                    </Badge>
                  </div>
                </div>

                {order.notes && (
                  <div className="mt-6 p-4 bg-white/5 text-[10px] leading-relaxed italic text-gray-400">
                    " {order.notes} "
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
