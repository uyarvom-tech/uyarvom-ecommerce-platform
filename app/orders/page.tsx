import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import Image from "next/image"

const statusColors = {
  pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  confirmed: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  processing: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  shipped: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
  delivered: "bg-green-500/10 text-green-700 dark:text-green-400",
  cancelled: "bg-red-500/10 text-red-700 dark:text-red-400",
}

export default async function OrdersPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/orders")
  }

  const { data: orders } = await supabase
    .from("orders")
    .select(
      `
      *,
      items:order_items(
        *,
        product:products(
          name,
          images:product_images(image_url, alt_text, is_primary)
        )
      )
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 px-6 py-8">
        <div className="container mx-auto max-w-7xl">
          <h1 className="mb-8 text-3xl font-bold tracking-tight">My Orders</h1>

          {!orders || orders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Package className="mb-4 h-16 w-16 text-muted-foreground" />
                <h2 className="mb-2 text-xl font-semibold">No orders yet</h2>
                <p className="mb-6 text-muted-foreground">Start shopping to place your first order</p>
                <Link
                  href="/products"
                  className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Browse Products
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const firstItem = order.items?.[0]
                const primaryImage =
                  firstItem?.product?.images?.find((img: any) => img.is_primary) || firstItem?.product?.images?.[0]

                return (
                  <Link key={order.id} href={`/orders/${order.id}`}>
                    <Card className="transition-all hover:shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div className="flex gap-4">
                            {primaryImage && (
                              <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                                <Image
                                  src={primaryImage.image_url || "/placeholder.svg"}
                                  alt={firstItem?.product_name || "Product"}
                                  width={80}
                                  height={80}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            )}
                            <div>
                              <div className="mb-1 flex items-center gap-2">
                                <p className="font-semibold">Order #{order.order_number}</p>
                                <Badge className={statusColors[order.status as keyof typeof statusColors]}>
                                  {order.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Placed on{" "}
                                {new Date(order.created_at).toLocaleDateString("en-IN", { dateStyle: "long" })}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {order.items?.length} {order.items?.length === 1 ? "item" : "items"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between md:flex-col md:items-end md:justify-center">
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Total</p>
                              <p className="text-xl font-bold">₹{order.total.toLocaleString("en-IN")}</p>
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
