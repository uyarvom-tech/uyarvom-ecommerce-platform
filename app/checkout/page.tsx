import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CheckoutForm } from "@/components/checkout-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import Image from "next/image"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function CheckoutPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/checkout")
  }

  const { data: cartItems } = await supabase
    .from("cart_items")
    .select(
      `
      *,
      product:products(
        *,
        images:product_images(image_url, alt_text, is_primary)
      )
    `,
    )
    .eq("user_id", user.id)

  if (!cartItems || cartItems.length === 0) {
    redirect("/cart")
  }

  const { data: addresses } = await supabase.from("addresses").select("*").eq("user_id", user.id)

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const shippingCost = subtotal >= 999 ? 0 : 50
  const tax = Math.round(subtotal * 0.18) // 18% GST
  const total = subtotal + shippingCost + tax

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 px-6 py-8">
        <div className="container mx-auto max-w-7xl">
          <h1 className="mb-8 text-3xl font-bold tracking-tight">Checkout</h1>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <CheckoutForm
                userId={user.id}
                addresses={addresses || []}
                profile={profile}
                cartItems={cartItems}
                orderTotal={{
                  subtotal,
                  shippingCost,
                  tax,
                  total,
                }}
              />
            </div>

            <div>
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {cartItems.map((item) => {
                      const primaryImage =
                        item.product.images?.find((img: any) => img.is_primary) || item.product.images?.[0]
                      return (
                        <div key={item.id} className="flex gap-3">
                          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                            <Image
                              src={
                                primaryImage?.image_url ||
                                `/placeholder.svg?height=80&width=80&query=${item.product.name || "/placeholder.svg"}`
                              }
                              alt={item.product.name}
                              width={80}
                              height={80}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{item.product.name}</p>
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                            <p className="text-sm font-semibold">
                              ₹{(item.product.price * item.quantity).toLocaleString("en-IN")}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <Separator />

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">₹{subtotal.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="font-medium">
                        {shippingCost === 0 ? "FREE" : `₹${shippingCost.toLocaleString("en-IN")}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax (GST 18%)</span>
                      <span className="font-medium">₹{tax.toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>₹{total.toLocaleString("en-IN")}</span>
                  </div>

                  <Button variant="outline" asChild className="w-full bg-transparent">
                    <Link href="/cart">Back to Cart</Link>
                  </Button>
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
