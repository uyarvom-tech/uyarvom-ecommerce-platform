import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Truck, Clock3, PackageCheck, AlertCircle } from "lucide-react"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default function ShippingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="py-16 md:py-24 bg-gradient-to-b from-secondary/20 to-background">
          <div className="max-w-[980px] mx-auto px-6 text-center space-y-6">
            <Badge className="bg-primary/10 text-primary border-primary/20">Shipping Policy</Badge>
            <h1 className="apple-headline">Clear shipping information before checkout</h1>
            <p className="apple-subheadline max-w-3xl mx-auto">
              Review dispatch timelines, delivery estimates, shipping charges, and what happens if an order is delayed or damaged in transit.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-[980px] mx-auto px-6 grid gap-6 md:grid-cols-2">
            <Card className="apple-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Clock3 className="h-5 w-5 text-primary" />
                  Processing Times
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>Most orders are packed and dispatched within 1 business day.</p>
                <p>Customized, fragile, or heavy orders may need extra preparation time.</p>
                <p>Orders placed on Sundays or public holidays are processed on the next business day.</p>
              </CardContent>
            </Card>

            <Card className="apple-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-primary" />
                  Delivery Timelines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>Metro cities: 2-4 business days after dispatch.</p>
                <p>Other serviceable cities: 3-5 business days after dispatch.</p>
                <p>Remote areas: 5-7 business days or more depending on courier coverage.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="py-16 bg-secondary/10">
          <div className="max-w-[980px] mx-auto px-6 grid gap-6 md:grid-cols-3">
            {[
              { icon: PackageCheck, title: "Shipping Charges", description: "Free shipping is available on qualifying orders. Charges for smaller orders are shown before payment." },
              { icon: AlertCircle, title: "Delays", description: "Weather, regional restrictions, or courier issues can affect delivery timelines. We will share updates when possible." },
              { icon: Truck, title: "Tracking", description: "Once shipped, you can follow the order using the tracking page or the update shared by email and SMS." },
            ].map((item) => (
              <Card key={item.title} className="apple-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <item.icon className="h-5 w-5 text-primary" />
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{item.description}</CardContent>
              </Card>
            ))}
          </div>

          <div className="max-w-[980px] mx-auto px-6 pt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="apple-button h-12 px-8">
              <Link href="/delivery">Check Delivery Area</Link>
            </Button>
            <Button asChild variant="outline" className="h-12 px-8">
              <Link href="/track">Track an Order</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
