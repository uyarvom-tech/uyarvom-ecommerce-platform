import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CartItemsList } from "@/components/cart-items-list"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingBag } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function CartPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/cart")
  }

  const { data: cartItems } = await supabase
    .from("cart_items")
    .select(
      `
      *,
      product:products(
        *,
        category:categories(name),
        images:product_images(image_url, alt_text, is_primary)
      )
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const subtotal = cartItems?.reduce((sum: number, item: any) => sum + item.product.price * item.quantity, 0) || 0

  const shippingCost = subtotal >= 999 ? 0 : 50
  const total = subtotal + shippingCost

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-muted/30 px-6 py-12">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="font-serif mb-3 text-4xl font-bold tracking-tight">Shopping Cart</h1>
            {cartItems && cartItems.length > 0 && (
              <p className="text-muted-foreground">
                {cartItems.length} item{cartItems.length !== 1 ? "s" : ""} in your cart
              </p>
            )}
          </div>

          {!cartItems || cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-background py-24">
              <ShoppingBag className="mb-6 h-24 w-24 text-muted-foreground/50" />
              <h2 className="font-serif mb-3 text-2xl font-semibold">Your cart is empty</h2>
              <p className="mb-8 text-muted-foreground">Add some products to get started</p>
              <Button asChild size="lg">
                <Link href="/products">Browse Products</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="mb-6 grid gap-4 rounded-lg border bg-background p-4 sm:grid-cols-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Secure Checkout</p>
                      <p className="text-xs text-muted-foreground">SSL encrypted</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Easy Returns</p>
                      <p className="text-xs text-muted-foreground">30-day policy</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Fast Delivery</p>
                      <p className="text-xs text-muted-foreground">3-5 business days</p>
                    </div>
                  </div>
                </div>

                <CartItemsList items={cartItems} />
              </div>

              <div>
                <Card className="sticky top-20 shadow-lg">
                  <CardHeader>
                    <CardTitle className="font-serif">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal ({cartItems.length} items)</span>
                      <span className="font-medium">₹{subtotal.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="font-medium">
                        {shippingCost === 0 ? (
                          <span className="text-green-600">FREE</span>
                        ) : (
                          `₹${shippingCost.toLocaleString("en-IN")}`
                        )}
                      </span>
                    </div>
                    {subtotal < 999 && (
                      <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-950/20">
                        <p className="text-xs font-medium text-amber-900 dark:text-amber-100">
                          Add ₹{(999 - subtotal).toLocaleString("en-IN")} more for FREE shipping! 🎉
                        </p>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-amber-200 dark:bg-amber-900">
                          <div
                            className="h-full bg-amber-500 transition-all duration-300"
                            style={{ width: `${Math.min((subtotal / 999) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <div className="border-t pt-4">
                      <div className="flex justify-between">
                        <span className="text-lg font-semibold">Total</span>
                        <span className="font-serif text-lg font-bold">₹{total.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                    <Button asChild className="w-full" size="lg">
                      <Link href="/checkout">Proceed to Checkout</Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full bg-transparent">
                      <Link href="/products">Continue Shopping</Link>
                    </Button>
                    <div className="flex items-center justify-center gap-2 pt-2 text-xs text-muted-foreground">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Secure SSL Encrypted Checkout</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
