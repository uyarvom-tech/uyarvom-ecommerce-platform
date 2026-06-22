import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Truck, Search, Package, CircleCheck } from "lucide-react"
import { supabaseAdmin } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"
export const revalidate = 0

const statusSteps = ["pending", "confirmed", "processing", "shipped", "delivered"]

const statusLabels: Record<string, string> = {
  pending: "Order placed",
  confirmed: "Confirmed",
  processing: "Preparing your order",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
}

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; email?: string }>
}) {
  const params = await searchParams
  const orderNumber = params.order?.trim()
  const email = params.email?.trim().toLowerCase()

  let order: any = null

  if (orderNumber && email) {
    const response = await supabaseAdmin
      .from("orders")
      .select("id, order_number, status, tracking_number, created_at, total, shipping_email, shipped_at, delivered_at")
      .eq("order_number", orderNumber)
      .eq("shipping_email", email)
      .maybeSingle()

    order = response.data
  }

  const currentStatusIndex = order ? statusSteps.findIndex((step) => step === order.status) : -1

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="py-16 md:py-24 bg-gradient-to-b from-secondary/20 to-background">
          <div className="max-w-[980px] mx-auto px-6 text-center space-y-6">
            <Badge className="bg-primary/10 text-primary border-primary/20">Track Order</Badge>
            <h1 className="apple-headline">Check the latest status of your order</h1>
            <p className="apple-subheadline max-w-3xl mx-auto">
              Enter your order number and the email used at checkout to view the current order status and courier details.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-[980px] mx-auto px-6 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <Card className="apple-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" />
                  Find Your Order
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" method="get">
                  <div className="space-y-2">
                    <label htmlFor="order" className="text-sm font-medium">Order Number</label>
                    <Input id="order" name="order" defaultValue={orderNumber ?? ""} placeholder="For example: UY12345" className="h-12" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">Email Address</label>
                    <Input id="email" name="email" type="email" defaultValue={email ?? ""} placeholder="you@example.com" className="h-12" />
                  </div>
                  <Button type="submit" className="apple-button h-12 px-8 w-full">
                    Check Status
                  </Button>
                </form>

                <div className="mt-6 text-sm text-muted-foreground">
                  Use the same email address you entered at checkout. If you are signed in, you can also review orders from{" "}
                  <Link href="/orders" className="text-primary hover:underline">
                    your account
                  </Link>.
                </div>
              </CardContent>
            </Card>

            <Card className="apple-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  Order Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {!orderNumber && !email && (
                  <div className="text-sm text-muted-foreground">
                    Enter your order number and email to see tracking updates here.
                  </div>
                )}

                {(orderNumber || email) && !order && (
                  <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                    We could not find an order that matches those details. Please check the order number and email address, then try again.
                  </div>
                )}

                {order && (
                  <>
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary">Order #{order.order_number}</p>
                      <p className="text-2xl font-semibold text-foreground">{statusLabels[order.status] || order.status}</p>
                      <p className="text-sm text-muted-foreground">
                        Placed on {new Date(order.created_at).toLocaleDateString("en-IN", { dateStyle: "long" })}
                      </p>
                    </div>

                    <Separator />

                    <div className="space-y-5">
                      {statusSteps.map((step, index) => {
                        const completed = currentStatusIndex >= index
                        return (
                          <div key={step} className="flex items-start gap-4">
                            <div className={`mt-1 h-8 w-8 rounded-full border flex items-center justify-center ${completed ? "bg-primary border-primary text-white" : "border-border text-muted-foreground"}`}>
                              {completed ? <CircleCheck className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                            </div>
                            <div>
                              <p className={`font-medium ${completed ? "text-foreground" : "text-muted-foreground"}`}>{statusLabels[step]}</p>
                              <p className="text-sm text-muted-foreground">
                                {step === "shipped" && order.shipped_at
                                  ? `Updated on ${new Date(order.shipped_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}`
                                  : step === "delivered" && order.delivered_at
                                    ? `Delivered on ${new Date(order.delivered_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}`
                                    : completed
                                      ? "Completed"
                                      : "Pending"}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <Separator />

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Tracking Number</p>
                        <p className="font-medium">{order.tracking_number || "Will be shared after dispatch"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Order Total</p>
                        <p className="font-medium">₹{Number(order.total || 0).toLocaleString("en-IN")}</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
