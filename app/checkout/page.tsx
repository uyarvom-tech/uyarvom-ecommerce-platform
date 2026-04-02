import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CheckoutForm } from "@/components/checkout-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import Image from "next/image"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PRODUCT_FALLBACK_IMAGE } from "@/lib/image-fallbacks"
import Script from "next/script"
import { getSystemSetting } from "@/lib/settings"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { syncAuthUserToPrisma } from "@/lib/user-sync"

export default async function CheckoutPage() {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect("/auth/login?redirect=/checkout")
  }

  const user = await syncAuthUserToPrisma(authUser)

  const cartItems = await prisma.cartItem.findMany({
    where: { userId: user.id },
    include: {
      product: {
        include: {
          images: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
      productVariant: true,
    },
    orderBy: { createdAt: "desc" },
  })

  if (!cartItems || cartItems.length === 0) {
    redirect("/cart")
  }

  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [
      { isDefault: "desc" },
      { createdAt: "desc" },
    ],
  })

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      fullName: true,
      phone: true,
    },
  })

  const normalizedAddresses = addresses.map((address) => ({
    id: address.id,
    full_name: address.fullName,
    phone: address.phone,
    address_line1: address.addressLine1,
    address_line2: address.addressLine2,
    city: address.city,
    state: address.state,
    postal_code: address.postalCode,
    country: address.country,
    is_default: address.isDefault,
  }))

  const normalizedProfile = profile
    ? {
        full_name: profile.fullName,
        phone: profile.phone,
      }
    : null

  const shippingThreshold = Number(await getSystemSetting("shipping_threshold", "999"))
  const shippingFee = Number(await getSystemSetting("shipping_fee", "50"))
  const taxRate = Number(await getSystemSetting("tax_rate", "18")) / 100

  const subtotal = cartItems.reduce((sum: number, item: any) => {
    const unitPrice = Number(item.productVariant?.price ?? item.product.price ?? 0)
    return sum + unitPrice * item.quantity
  }, 0)
  const shippingCost = subtotal >= shippingThreshold ? 0 : shippingFee
  const tax = Math.round(subtotal * taxRate)
  const total = subtotal + shippingCost + tax

  return (
    <div className="flex min-h-screen flex-col">
      <Script id="razorpay-checkout-js" src="https://checkout.razorpay.com/v1/checkout.js" />
      <Header />
      <main className="flex-1 px-6 py-8">
        <div className="container mx-auto max-w-7xl">
          <h1 className="mb-8 text-3xl font-bold tracking-tight">Checkout</h1>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <CheckoutForm
                userId={user.id}
                addresses={normalizedAddresses}
                profile={normalizedProfile}
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
                    {cartItems.map((item: any) => {
                      const primaryImage =
                        item.product.images?.find((img: any) => img.is_primary) || item.product.images?.[0]
                      const unitPrice = Number(item.productVariant?.price ?? item.product.price ?? 0)

                      return (
                        <div key={item.id} className="flex gap-3">
                          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                            <Image
                              src={primaryImage?.image_url || PRODUCT_FALLBACK_IMAGE}
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
                              Rs.{(unitPrice * item.quantity).toLocaleString("en-IN")}
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
                      <span className="font-medium">Rs.{subtotal.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="font-medium">
                        {shippingCost === 0 ? "FREE" : `Rs.${shippingCost.toLocaleString("en-IN")}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax (GST {taxRate * 100}%)</span>
                      <span className="font-medium">Rs.{tax.toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>Rs.{total.toLocaleString("en-IN")}</span>
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
