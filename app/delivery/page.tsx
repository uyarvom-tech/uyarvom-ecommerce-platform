import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { DeliveryChecker } from "@/components/delivery-checker"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Package, Truck, ShieldCheck } from "lucide-react"

export const dynamic = "force-dynamic"
export const revalidate = 0

const deliverySteps = [
  { title: "Order Confirmed", description: "You will receive an email and SMS once your order is confirmed." },
  { title: "Packed Securely", description: "Each item is checked and packed to reduce breakage in transit." },
  { title: "Shipped", description: "Tracking details are shared as soon as the courier scans your package." },
  { title: "Delivered", description: "Delivery updates continue until the parcel reaches your address." },
]

export default function DeliveryPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="py-16 md:py-24 bg-gradient-to-b from-secondary/20 to-background">
          <div className="max-w-[980px] mx-auto px-6 text-center space-y-6">
            <Badge className="bg-primary/10 text-primary border-primary/20">Delivery Information</Badge>
            <h1 className="apple-headline">Check delivery timelines before you order</h1>
            <p className="apple-subheadline max-w-3xl mx-auto">
              Enter your pincode to see an estimated delivery window, then review how packing, shipping, and order updates work at Uyarvom.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-[980px] mx-auto px-6 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="apple-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Delivery Estimate by Pincode
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DeliveryChecker />
              </CardContent>
            </Card>

            <Card className="apple-card">
              <CardHeader>
                <CardTitle>What to expect</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>Orders are usually processed within 24 hours on business days.</p>
                <p>Fragile items may need extra packing time before dispatch.</p>
                <p>Remote locations can take longer than metro cities.</p>
                <p>Tracking updates begin after the courier scans the shipment.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="py-16 bg-secondary/10">
          <div className="max-w-[980px] mx-auto px-6">
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {deliverySteps.map((step, index) => (
                <Card key={step.title} className="apple-card">
                  <CardHeader>
                    <CardTitle className="text-lg">{index + 1}. {step.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">{step.description}</CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-[980px] mx-auto px-6 grid gap-6 md:grid-cols-3">
            {[
              { icon: Package, title: "Safe Packaging", description: "Protective packing is used for fragile and handcrafted products." },
              { icon: Truck, title: "Courier Updates", description: "Order progress can be tracked from confirmation to delivery." },
              { icon: ShieldCheck, title: "Support Available", description: "If a shipment is delayed, our support team can help quickly." },
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
        </section>
      </main>
      <Footer />
    </div>
  )
}
