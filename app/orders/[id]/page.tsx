import { prisma } from "@/lib/prisma"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Package, MapPin, CreditCard, Truck, History } from "lucide-react"
import { notFound, redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { PRODUCT_FALLBACK_IMAGE } from "@/lib/image-fallbacks"
import { createClient } from "@/lib/supabase/server"
import { OrderTimeline } from "@/components/order-timeline"
import { OrderActions } from "@/components/order-actions"
import { getSystemSetting } from "@/lib/settings"

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
  confirmed: "bg-blue-500/10 text-blue-700 border-blue-200",
  processing: "bg-purple-500/10 text-purple-700 border-purple-200",
  shipped: "bg-indigo-500/10 text-indigo-700 border-indigo-200",
  delivered: "bg-green-500/10 text-green-700 border-green-200",
  cancelled: "bg-red-500/10 text-red-700 border-red-200",
}

const paymentStatusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
  paid: "bg-green-500/10 text-green-700 border-green-200",
  failed: "bg-red-500/10 text-red-700 border-red-200",
  refunded: "bg-gray-500/10 text-gray-700 border-gray-200",
}

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/orders")
  }

  const order = await prisma.order.findUnique({
    where: {
      id: params.id,
      userId: user.id
    },
    include: {
      orderItems: {
        include: {
          product: {
            include: {
              images: {
                where: { isPrimary: true },
                take: 1
              }
            }
          }
        }
      },
      events: true,
      shippingAddress: true,
      billingAddress: true,
    }
  })

  if (!order) {
    notFound()
  }

  const returnWindow = Number(await getSystemSetting("return_window", "7"))

  return (
    <div className="flex min-h-screen flex-col bg-[#FDFCFB]">
      <Header />
      <main className="flex-1 px-6 py-12">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <Link href="/orders" className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
                ← Back to Order History
              </Link>
              <h1 className="mt-4 font-playfair text-4xl font-black">Order #{order.orderNumber}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", { dateStyle: "long" })}
              </p>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <Badge variant="outline" className={`${statusColors[order.status]} px-4 py-1 rounded-none text-[10px] font-bold uppercase tracking-widest`}>
                {order.status}
              </Badge>
              <Badge variant="outline" className={`${paymentStatusColors[order.paymentStatus]} px-4 py-1 rounded-none text-[10px] font-bold uppercase tracking-widest`}>
                Payment: {order.paymentStatus}
              </Badge>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-8 space-y-8">
              {/* Order Items */}
              <Card className="rounded-none border-none shadow-sm">
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest">
                    <Package className="h-4 w-4" />
                    Items ({order.orderItems.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {order.orderItems.map((item) => {
                      const primaryImage = item.product?.images?.[0]?.imageUrl || PRODUCT_FALLBACK_IMAGE

                      return (
                        <div key={item.id} className="flex gap-6 p-6">
                          <div className="h-24 w-24 flex-shrink-0 overflow-hidden bg-muted">
                            <Image
                              src={primaryImage}
                              alt={item.productName || "Product"}
                              width={96}
                              height={96}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="flex flex-1 flex-col justify-between">
                            <div>
                              <p className="font-playfair text-lg font-bold">{item.productName}</p>
                              {item.variantName && (
                                <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
                                  {item.variantName}
                                </p>
                              )}
                              <p className="text-sm text-muted-foreground mt-1">Quantity: {item.quantity}</p>
                            </div>
                            <p className="font-bold">₹{item.price.toLocaleString("en-IN")}</p>
                          </div>
                          <div className="text-right flex flex-col justify-end">
                            <p className="text-lg font-black tracking-tight">₹{item.total.toLocaleString("en-IN")}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Details */}
              <div className="grid gap-8 md:grid-cols-2">
                <Card className="rounded-none border-none shadow-sm">
                  <CardHeader className="border-b">
                    <CardTitle className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest">
                      <MapPin className="h-4 w-4" />
                      Shipping Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 text-sm space-y-1">
                    <p className="font-bold text-base mb-2">{order.shippingName}</p>
                    <p>{order.shippingAddress1}</p>
                    {order.shippingAddress2 && <p>{order.shippingAddress2}</p>}
                    <p>{order.shippingCity}, {order.shippingState} {order.shippingZip}</p>
                    <p className="pt-2 text-muted-foreground">Email: {order.shippingEmail}</p>
                    <p className="text-muted-foreground">Phone: {order.shippingPhone}</p>
                  </CardContent>
                </Card>

                <Card className="rounded-none border-none shadow-sm">
                  <CardHeader className="border-b">
                    <CardTitle className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest">
                      <CreditCard className="h-4 w-4" />
                      Payment & Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 text-sm space-y-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Method</p>
                      <p className="font-medium capitalize">{order.paymentMethod.replace("_", " ")}</p>
                    </div>
                    {order.notes && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Notes</p>
                        <p className="italic text-muted-foreground">"{order.notes}"</p>
                      </div>
                    )}
                    {order.trackingNumber && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Tracking</p>
                        <p className="font-mono">{order.trackingNumber}</p>
                        {order.courierName && <p className="text-xs text-muted-foreground">{order.courierName}</p>}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-8">
              {/* Summary */}
              <Card className="rounded-none border-none shadow-sm bg-black text-white">
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-widest">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Subtotal</span>
                    <span>₹{order.subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Shipping</span>
                    <span>{order.shipping === 0 ? "FREE" : `₹${order.shipping.toLocaleString("en-IN")}`}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Tax (GST)</span>
                    <span>₹{order.tax.toLocaleString("en-IN")}</span>
                  </div>
                  <Separator className="bg-white/10" />
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span className="text-primary-foreground">₹{order.total.toLocaleString("en-IN")}</span>
                  </div>

                  <div className="pt-4">
                    <OrderActions order={order} returnWindow={returnWindow} />
                  </div>
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card className="rounded-none border-none shadow-sm">
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest">
                    <History className="h-4 w-4" />
                    Order Journey
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <OrderTimeline events={order.events} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
