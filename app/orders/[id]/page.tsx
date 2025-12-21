import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Package, MapPin, CreditCard, Truck } from "lucide-react"
import { notFound, redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"

const statusColors = {
  pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  confirmed: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  processing: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  shipped: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
  delivered: "bg-green-500/10 text-green-700 dark:text-green-400",
  cancelled: "bg-red-500/10 text-red-700 dark:text-red-400",
}

const paymentStatusColors = {
  pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  paid: "bg-green-500/10 text-green-700 dark:text-green-400",
  failed: "bg-red-500/10 text-red-700 dark:text-red-400",
  refunded: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
}

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/orders")
  }

  const { data: order } = await supabase
    .from("orders")
    .select(
      `
      *,
      items:order_items(
        *,
        product:products(
          slug,
          images:product_images(image_url, alt_text, is_primary)
        )
      ),
      shipping_address:addresses!orders_shipping_address_id_fkey(*),
      billing_address:addresses!orders_billing_address_id_fkey(*)
    `,
    )
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single()

  if (!order) {
    notFound()
  }

  const statusSteps = [
    { status: "pending", label: "Order Placed", date: order.created_at },
    { status: "confirmed", label: "Confirmed", date: order.created_at },
    { status: "processing", label: "Processing", date: null },
    { status: "shipped", label: "Shipped", date: order.shipped_at },
    { status: "delivered", label: "Delivered", date: order.delivered_at },
  ]

  const currentStatusIndex = statusSteps.findIndex((step) => step.status === order.status)

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 px-6 py-8">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-6">
            <Link href="/orders" className="text-sm text-muted-foreground hover:text-foreground">
              ← Back to Orders
            </Link>
          </div>

          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold tracking-tight">Order #{order.order_number}</h1>
              <p className="text-muted-foreground">
                Placed on {new Date(order.created_at).toLocaleDateString("en-IN", { dateStyle: "long" })}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge className={statusColors[order.status as keyof typeof statusColors]}>{order.status}</Badge>
              <Badge className={paymentStatusColors[order.payment_status as keyof typeof paymentStatusColors]}>
                {order.payment_status}
              </Badge>
            </div>
          </div>

          {/* Order Timeline */}
          {order.status !== "cancelled" && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Order Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute left-4 top-0 h-full w-0.5 bg-border" />
                  <div className="space-y-6">
                    {statusSteps.map((step, index) => {
                      const isCompleted = index <= currentStatusIndex
                      const isCurrent = index === currentStatusIndex

                      return (
                        <div key={step.status} className="relative flex gap-4">
                          <div
                            className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                              isCompleted ? "border-primary bg-primary" : "border-border bg-background"
                            }`}
                          >
                            {isCompleted && (
                              <svg
                                className="h-4 w-4 text-primary-foreground"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 pt-0.5">
                            <p className={`font-medium ${isCurrent ? "text-primary" : ""}`}>{step.label}</p>
                            {step.date && isCompleted && (
                              <p className="text-sm text-muted-foreground">
                                {new Date(step.date).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                {order.tracking_number && (
                  <div className="mt-6 rounded-md bg-muted p-4">
                    <p className="text-sm font-medium">Tracking Number</p>
                    <p className="font-mono text-lg">{order.tracking_number}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Items ({order.items?.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {order.items?.map((item: any) => {
                    const primaryImage =
                      item.product?.images?.find((img: any) => img.is_primary) || item.product?.images?.[0]

                    return (
                      <div key={item.id} className="flex gap-4">
                        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                          <Image
                            src={
                              primaryImage?.image_url ||
                              `/placeholder.svg?height=100&width=100&query=${item.product_name}`
                            }
                            alt={item.product_name}
                            width={100}
                            height={100}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          {item.product?.slug ? (
                            <Link href={`/products/${item.product.slug}`} className="font-semibold hover:underline">
                              {item.product_name}
                            </Link>
                          ) : (
                            <p className="font-semibold">{item.product_name}</p>
                          )}
                          {item.variant_name && <p className="text-sm text-muted-foreground">{item.variant_name}</p>}
                          <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                          <p className="mt-1 font-semibold">₹{item.price.toLocaleString("en-IN")} each</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">₹{item.total.toLocaleString("en-IN")}</p>
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              {/* Shipping Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {order.shipping_address && (
                    <div>
                      <p className="font-semibold">{order.shipping_address.full_name}</p>
                      <p className="text-sm text-muted-foreground">{order.shipping_address.address_line1}</p>
                      {order.shipping_address.address_line2 && (
                        <p className="text-sm text-muted-foreground">{order.shipping_address.address_line2}</p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {order.shipping_address.city}, {order.shipping_address.state}{" "}
                        {order.shipping_address.postal_code}
                      </p>
                      <p className="text-sm text-muted-foreground">Phone: {order.shipping_address.phone}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium capitalize">{order.payment_method.replace("_", " ")}</p>
                  {order.payment_method === "cod" && (
                    <p className="text-sm text-muted-foreground">Pay when you receive your order</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">₹{order.subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">
                      {order.shipping_cost === 0 ? "FREE" : `₹${order.shipping_cost.toLocaleString("en-IN")}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-medium">₹{order.tax.toLocaleString("en-IN")}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span className="font-medium">-₹{order.discount.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>₹{order.total.toLocaleString("en-IN")}</span>
                  </div>

                  {order.notes && (
                    <>
                      <Separator />
                      <div>
                        <p className="mb-1 text-sm font-medium">Order Notes</p>
                        <p className="text-sm text-muted-foreground">{order.notes}</p>
                      </div>
                    </>
                  )}
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
