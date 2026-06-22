import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCcw, PackageOpen, CircleCheck, MessageSquare } from "lucide-react"

export const dynamic = "force-dynamic"
export const revalidate = 0

const returnSteps = [
  "Contact support within 30 days of delivery.",
  "Share your order number and the reason for the return or exchange.",
  "Wait for approval and packing instructions from our team.",
  "Send the item back in unused condition with original packaging, where possible.",
]

export default function ReturnsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="py-16 md:py-24 bg-gradient-to-b from-secondary/20 to-background">
          <div className="max-w-[980px] mx-auto px-6 text-center space-y-6">
            <Badge className="bg-primary/10 text-primary border-primary/20">Returns & Exchanges</Badge>
            <h1 className="apple-headline">Simple guidance for returns, exchanges, and refunds</h1>
            <p className="apple-subheadline max-w-3xl mx-auto">
              Review which products are eligible, how to request a return, and what happens after we receive the item back.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-[980px] mx-auto px-6 grid gap-6 md:grid-cols-3">
            {[
              { icon: CircleCheck, title: "Eligible items", description: "Unused items in original condition are generally eligible for return within 30 days." },
              { icon: PackageOpen, title: "Damaged on arrival", description: "If an item arrives damaged, contact us quickly with photos so we can help." },
              { icon: RefreshCcw, title: "Refund timing", description: "Approved refunds are processed after the returned item is received and checked." },
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

        <section className="py-16 bg-secondary/10">
          <div className="max-w-[980px] mx-auto px-6 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <Card className="apple-card">
              <CardHeader>
                <CardTitle>How to request a return</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {returnSteps.map((step, index) => (
                  <div key={step} className="flex gap-3">
                    <div className="h-7 w-7 flex-shrink-0 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </div>
                    <p className="text-sm text-muted-foreground">{step}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="apple-card">
              <CardHeader>
                <CardTitle>Important notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>Items returned without prior approval may face delays in processing.</p>
                <p>Used, damaged-after-delivery, or final-sale items may not be eligible for return.</p>
                <p>Exchange availability depends on stock at the time your request is reviewed.</p>
                <p>If you need help, our support team can guide you through the next steps.</p>

                <div className="pt-4 flex flex-col sm:flex-row gap-4">
                  <Button asChild className="apple-button h-12 px-8">
                    <Link href="/support">Contact Support</Link>
                  </Button>
                  <Button asChild variant="outline" className="h-12 px-8">
                    <Link href="/track">Track Existing Order</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
