import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { OfferCopyButton } from "@/components/offer-copy-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tag, Gift, Percent, ShoppingBag } from "lucide-react"

export const dynamic = "force-dynamic"
export const revalidate = 0

const offers = [
  {
    title: "First order discount",
    code: "ARTVOM500",
    savings: "Save ₹500",
    details: "Valid on your first order above ₹4,999.",
  },
  {
    title: "One day sale",
    code: "ODS30",
    savings: "Extra 30% off",
    details: "Applies to selected sale products only.",
  },
  {
    title: "Free shipping",
    code: "AUTO",
    savings: "Free delivery",
    details: "Automatically applied on orders above ₹4,999.",
  },
]

export default function OffersPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="py-16 md:py-24 bg-gradient-to-b from-secondary/20 to-background">
          <div className="max-w-[980px] mx-auto px-6 text-center space-y-6">
            <Badge className="bg-primary/10 text-primary border-primary/20">Current Offers</Badge>
            <h1 className="apple-headline">Save more on your next order</h1>
            <p className="apple-subheadline max-w-3xl mx-auto">
              Browse active promotions, copy coupon codes, and see which offers are applied automatically at checkout.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-[980px] mx-auto px-6 grid gap-6 md:grid-cols-3">
            {offers.map((offer, index) => (
              <Card key={offer.code} className="apple-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">Offer {index + 1}</Badge>
                    <Tag className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">{offer.savings}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{offer.title}</p>
                    <p className="text-sm text-muted-foreground">{offer.details}</p>
                  </div>
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary">{offer.code}</p>
                  </div>
                  {offer.code === "AUTO" ? (
                    <p className="text-sm text-muted-foreground">This offer is applied automatically when eligible.</p>
                  ) : (
                    <OfferCopyButton code={offer.code} />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="py-16 bg-secondary/10">
          <div className="max-w-[980px] mx-auto px-6 grid gap-6 md:grid-cols-3">
            {[
              { icon: Gift, title: "How to use a code", description: "Add products to cart, enter the code at checkout, and the discount will be applied if the order qualifies." },
              { icon: Percent, title: "Offer terms", description: "Only one coupon code can be used per order unless we clearly mention otherwise." },
              { icon: ShoppingBag, title: "Need help?", description: "If an offer is not applying as expected, contact support before placing your order." },
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

          <div className="max-w-[980px] mx-auto px-6 pt-10 text-center">
            <Button asChild className="apple-button h-12 px-8">
              <Link href="/products">Start Shopping</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
