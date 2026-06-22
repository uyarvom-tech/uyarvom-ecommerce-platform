import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SupportForm } from "@/components/support-form"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import {
  MessageCircle,
  Mail,
  Phone,
  Clock,
  HelpCircle,
  Truck,
  RefreshCw,
  Shield,
  Search,
  ChevronRight,
  Star
} from "lucide-react"
import Link from "next/link"

export const dynamic = 'force-dynamic'

const faqs = [
  {
    question: "What is your return policy?",
    answer: "We offer a 7-day return policy for most handcrafted items. Must be in original condition with packaging."
  },
  {
    question: "How long does shipping take?",
    answer: "Standard shipping takes 3-7 business days across India. Handcrafted items may take longer as noted in product descriptions."
  },
  {
    question: "Are your products dishwasher safe?",
    answer: "Our ceramic stoneware is dishwasher and microwave safe. However, items with gold/silver leaf details should be hand-washed."
  },
]

export default async function SupportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let orders: any[] = []
  if (user) {
    orders = await prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, orderNumber: true }
    })
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FDFCFB]">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 bg-black text-white overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] rounded-full bg-primary blur-[100px]" />
          </div>

          <div className="container mx-auto max-w-4xl px-6 relative z-10 text-center">
            <Badge variant="outline" className="mb-6 border-primary/50 text-primary-foreground px-4 py-1 rounded-none text-[10px] font-bold uppercase tracking-widest">
              Uyarvom Concierge
            </Badge>
            <h1 className="font-playfair text-6xl md:text-7xl font-black mb-6 tracking-tight leading-none">
              How can we <br /><span className="text-muted-foreground italic">help you</span> today?
            </h1>
            <p className="text-gray-400 max-w-xl mx-auto text-sm uppercase tracking-[0.2em] font-medium leading-loose">
              Our dedicated support team is here to ensure your journey with Uyarvom is as seamless as our glazes.
            </p>
          </div>
        </section>

        {/* Support Channels & Form */}
        <section className="py-24 px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="grid gap-16 lg:grid-cols-2">
              {/* Left Side: Info & Channels */}
              <div className="space-y-12">
                <div>
                  <h2 className="font-playfair text-4xl font-bold mb-6">Connect with us</h2>
                  <p className="text-muted-foreground leading-relaxed max-w-md">
                    Choose the channel that works best for you. We typically respond within 2 hours during business hours.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 bg-black text-white flex items-center justify-center shrink-0">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold uppercase tracking-widest text-[10px] mb-1">Email Support</p>
                      <p className="text-xl font-bold">concierge@uyarvom.com</p>
                      <p className="text-sm text-muted-foreground mt-1">Best for tracking issues & detailed queries</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 bg-black text-white flex items-center justify-center shrink-0">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold uppercase tracking-widest text-[10px] mb-1">Phone Inquiry</p>
                      <p className="text-xl font-bold">+91 98765 43210</p>
                      <p className="text-sm text-muted-foreground mt-1">Available 9 AM - 8 PM, Mon - Sat</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 bg-black text-white flex items-center justify-center shrink-0">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold uppercase tracking-widest text-[10px] mb-1">Instant Response</p>
                      <p className="text-xl font-bold italic">Live Concierge</p>
                      <p className="text-sm text-muted-foreground mt-1 underline cursor-pointer hover:text-black">Open 24/7 via WhatsApp</p>
                    </div>
                  </div>
                </div>

                <div className="pt-8">
                  <div className="p-8 bg-[#F9F7F5] border-l-4 border-black">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-black text-black" />)}
                    </div>
                    <p className="font-playfair text-xl italic font-bold">
                      "The support at Uyarvom is just as premium as their products. Truly India's finest."
                    </p>
                    <p className="text-xs font-bold uppercase tracking-widest mt-4">— Aditi R., Mumbai</p>
                  </div>
                </div>
              </div>

              {/* Right Side: Support Ticket Form */}
              <div id="support-form-container">
                <Card className="rounded-none border-none shadow-2xl p-8 md:p-12">
                  <div className="mb-10">
                    <h3 className="font-playfair text-3xl font-bold mb-2">Raise a Ticket</h3>
                    <p className="text-sm text-muted-foreground">The most efficient way to resolve account and order issues.</p>
                  </div>

                  {!user ? (
                    <div className="text-center py-12 border-2 border-dashed border-muted">
                      <p className="mb-6 font-medium">Please login to submit a support ticket.</p>
                      <Link href="/auth/login?redirect=/support" className="bg-black text-white px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-black/80">
                        Login to Continue
                      </Link>
                    </div>
                  ) : (
                    <SupportForm orders={orders} />
                  )}
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-24 bg-[#111111] text-white">
          <div className="container mx-auto max-w-5xl px-6">
            <h2 className="font-playfair text-4xl font-bold mb-16 text-center">Frequently asked questions</h2>
            <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3">
              {faqs.map((faq, i) => (
                <div key={i} className="space-y-4">
                  <h4 className="font-bold text-lg border-b border-white/10 pb-4 flex items-start gap-3">
                    <HelpCircle className="h-5 w-5 text-primary shrink-0 transition-transform hover:rotate-12" />
                    {faq.question}
                  </h4>
                  <p className="text-gray-400 text-sm leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
