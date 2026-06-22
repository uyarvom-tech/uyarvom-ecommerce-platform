import { prisma } from "@/lib/prisma"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, ChevronRight, ShoppingBag } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import Image from "next/image"
import { PRODUCT_FALLBACK_IMAGE } from "@/lib/image-fallbacks"
import { createClient } from "@/lib/supabase/server"

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
  confirmed: "bg-blue-500/10 text-blue-700 border-blue-200",
  processing: "bg-purple-500/10 text-purple-700 border-purple-200",
  shipped: "bg-indigo-500/10 text-indigo-700 border-indigo-200",
  delivered: "bg-green-500/10 text-green-700 border-green-200",
  cancelled: "bg-red-500/10 text-red-700 border-red-200",
}

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/orders")
  }

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: {
      orderItems: {
        include: {
          product: {
            include: {
              images: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
        },
        take: 1,
      },
      _count: {
        select: { orderItems: true }
      }
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="flex min-h-screen flex-col bg-[#FDFCFB]">
      <Header />
      <main className="flex-1 px-6 py-12">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <h1 className="font-playfair text-5xl font-black mb-4">My Orders</h1>
            <p className="text-muted-foreground uppercase tracking-widest text-xs font-bold">Trace your handcrafted journey</p>
          </div>

          {orders.length === 0 ? (
            <Card className="rounded-none border-dashed border-2 bg-transparent">
              <CardContent className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-6">
                  <ShoppingBag className="h-10 w-10 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-playfair font-bold mb-3">No orders placed yet</h2>
                <p className="mb-8 text-muted-foreground max-w-sm">
                  Your kitchen is waiting for some Uyarvom magic. Explore our collection of premium ceramic wares.
                </p>
                <Link
                  href="/products"
                  className="bg-black text-white px-10 py-4 text-xs font-bold uppercase tracking-widest hover:bg-black/80 transition-all"
                >
                  Start Shopping
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => {
                const firstItem = order.orderItems[0]
                const primaryImage = firstItem?.product?.images?.[0]?.imageUrl || PRODUCT_FALLBACK_IMAGE

                return (
                  <Link key={order.id} href={`/orders/${order.id}`}>
                    <Card className="rounded-none border-none shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x">
                          {/* Image & Main Info */}
                          <div className="flex-1 p-6 flex gap-6">
                            <div className="h-24 w-24 flex-shrink-0 bg-muted overflow-hidden">
                              <Image
                                src={primaryImage}
                                alt={firstItem?.productName || "Order"}
                                width={96}
                                height={96}
                                className="h-full w-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-500"
                              />
                            </div>
                            <div className="flex flex-col justify-between py-1">
                              <div>
                                <div className="flex items-center gap-3 mb-1">
                                  <p className="font-bold text-lg">Order #{order.orderNumber}</p>
                                  <Badge variant="outline" className={`${statusColors[order.status]} px-2 py-0 rounded-none text-[9px] font-bold uppercase tracking-tighter`}>
                                    {order.status}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", { dateStyle: "long" })}
                                </p>
                              </div>
                              <p className="text-xs font-bold uppercase tracking-widest text-primary">
                                {order._count.orderItems} {order._count.orderItems === 1 ? "Item" : "Items"}
                              </p>
                            </div>
                          </div>

                          {/* Pricing & CTA */}
                          <div className="p-6 md:w-48 bg-[#F9F7F5] flex flex-row md:flex-col justify-between items-center md:items-end text-right">
                            <div>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Amount</p>
                              <p className="text-2xl font-black tracking-tight">₹{order.total.toLocaleString("en-IN")}</p>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary group-hover:gap-4 transition-all duration-300">
                              View Details
                              <ChevronRight className="h-4 w-4" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
