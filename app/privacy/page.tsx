import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = "force-dynamic"
export const revalidate = 0

const sections = [
  {
    title: "Information we collect",
    body: "We may collect your name, email address, phone number, shipping address, billing details, and order history when you place an order or contact support.",
  },
  {
    title: "How we use your information",
    body: "We use your information to process orders, share shipping updates, answer support requests, improve the shopping experience, and send essential service messages.",
  },
  {
    title: "Payments and security",
    body: "Payment information is handled through secure payment partners. We do not store full card details on this storefront.",
  },
  {
    title: "Sharing data",
    body: "We only share necessary information with logistics partners, payment providers, and service providers required to complete your order or support request.",
  },
  {
    title: "Your choices",
    body: "You can request updates to your personal details, ask questions about your data, or contact support for help with account-related concerns.",
  },
  {
    title: "Policy updates",
    body: "This page may be updated from time to time as our services change. The latest version published here applies to new activity on the site.",
  },
]

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="py-16 md:py-24 bg-gradient-to-b from-secondary/20 to-background">
          <div className="max-w-[980px] mx-auto px-6 text-center space-y-6">
            <Badge className="bg-primary/10 text-primary border-primary/20">Privacy Policy</Badge>
            <h1 className="apple-headline">How we handle your information</h1>
            <p className="apple-subheadline max-w-3xl mx-auto">
              This page explains what information may be collected through Uyarvom, how it is used, and when it is shared to complete your order or support request.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-[980px] mx-auto px-6 grid gap-6 md:grid-cols-2">
            {sections.map((section) => (
              <Card key={section.title} className="apple-card">
                <CardHeader>
                  <CardTitle>{section.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-7 text-muted-foreground">{section.body}</CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
