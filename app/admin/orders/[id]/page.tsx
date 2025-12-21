import { createClient } from "@/lib/supabase/server"
import { AdminHeader } from "@/components/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { OrderStatusUpdater } from "@/components/order-status-updater"
import { Package, MapPin, User } from "lucide-react"
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

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/admin/orders")
  }

  const { data: adminUser } = await supabase.from("admin_users").select("*").eq("id", user.id).single()

  if (!adminUser) {
    redirect("/")
  }

  const { data: order } = await supabase
    .from("orders")
    .select(
      `
      *,
      items:order_items(
        *,
        product:products(slug, images:product_images(image_url, alt_text, is_primary))
      ),
      shipping_address:addresses!orders_shipping_address_id_fkey(*),
      profiles(full_name, email, phone)
    `,
    )
    .eq("id", params.id)
    .single()

  if (!order) {
    notFound()
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <AdminHeader />
      <main className="flex-1 px-6 py-8">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-6">
            <Link href="/admin/orders" className="text-sm text-muted-foreground hover:text-foreground">
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
            <Badge className={statusColors[order.status as keyof typeof statusColors]}>{order.status}</Badge>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {/* Order Status Update */}
              <Card>
                <CardHeader>
                  <CardTitle>Update Order Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <OrderStatusUpdater
                    orderId={order.id}
                    currentStatus={order.status}
                    currentTrackingNumber={order.tracking_number}
                  />
                </CardContent>
              </Card>

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
                              `/placeholder.svg?height=100&width=100&query=${item.product_name || "/placeholder.svg"}`
                            }
                            alt={item.product_name}
                            width={100}
                            height={100}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{item.product_name}</p>
                          {item.variant_name && <p className="text-sm text-muted-foreground">{item.variant_name}</p>}
                          <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                          <p className="mt-1 font-semibold">₹{Number(item.price).toLocaleString("en-IN")} each</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">₹{Number(item.total).toLocaleString("en-IN")}</p>
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              {/* Customer Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{order.profiles?.full_name || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{order.profiles?.email || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{order.profiles?.phone || "N/A"}</p>
                    </div>
                  </div>
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
                    <span className="font-medium">₹{Number(order.subtotal).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">
                      {order.shipping_cost === 0 ? "FREE" : `₹${Number(order.shipping_cost).toLocaleString("en-IN")}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-medium">₹{Number(order.tax).toLocaleString("en-IN")}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>₹{Number(order.total).toLocaleString("en-IN")}</span>
                  </div>

                  <Separator />

                  <div>
                    <p className="mb-1 text-sm font-medium">Payment Method</p>
                    <p className="text-sm capitalize">{order.payment_method.replace("_", " ")}</p>
                  </div>

                  <div>
                    <p className="mb-1 text-sm font-medium">Payment Status</p>
                    <Badge className={statusColors[order.payment_status as keyof typeof statusColors]}>
                      {order.payment_status}
                    </Badge>
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
    </div>
  )
}
