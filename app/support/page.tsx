import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { AppleReveal } from "@/components/apple-scroll-animations"
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

const faqs = [
  {
    question: "What is your return policy?",
    answer: "We offer a 30-day return policy for all unused items in original packaging. Simply contact our support team to initiate a return."
  },
  {
    question: "How long does shipping take?",
    answer: "Standard shipping takes 3-5 business days within India. Express shipping is available for 1-2 day delivery in major cities."
  },
  {
    question: "Are your products dishwasher safe?",
    answer: "Most of our ceramic and stainless steel products are dishwasher safe. Check individual product descriptions for specific care instructions."
  },
  {
    question: "Do you offer international shipping?",
    answer: "Currently, we only ship within India. We're working on expanding to international markets soon."
  },
  {
    question: "How can I track my order?",
    answer: "Once your order ships, you'll receive a tracking number via email and SMS. You can also track orders in your account dashboard."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit/debit cards, UPI, net banking, and cash on delivery for eligible orders."
  }
]

const supportChannels = [
  {
    icon: MessageCircle,
    title: "Live Chat",
    description: "Get instant help from our support team",
    availability: "24/7 Available",
    action: "Start Chat",
    primary: true
  },
  {
    icon: Mail,
    title: "Email Support",
    description: "Send us detailed questions or concerns",
    availability: "Response within 2 hours",
    action: "Send Email",
    contact: "support@uyarvom.com"
  },
  {
    icon: Phone,
    title: "Phone Support",
    description: "Speak directly with our experts",
    availability: "Mon-Sat, 9 AM - 8 PM",
    action: "Call Now",
    contact: "+91 98765 43210"
  }
]

const helpCategories = [
  {
    icon: Truck,
    title: "Shipping & Delivery",
    description: "Track orders, shipping info, delivery updates",
    articles: 12
  },
  {
    icon: RefreshCw,
    title: "Returns & Exchanges",
    description: "Return policy, exchange process, refunds",
    articles: 8
  },
  {
    icon: Shield,
    title: "Product Care",
    description: "Maintenance tips, warranty, care instructions",
    articles: 15
  },
  {
    icon: HelpCircle,
    title: "Account & Orders",
    description: "Account management, order history, payments",
    articles: 10
  }
]

export default function SupportPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-secondary/20 to-background">
          <div className="max-w-[980px] mx-auto px-6 text-center">
            <AppleReveal>
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                24/7 Support Available
              </Badge>
              <h1 className="apple-headline mb-6">
                How can we help you?
              </h1>
              <p className="apple-subheadline mb-8 max-w-2xl mx-auto">
                Get the support you need, when you need it. Our team is here to help with any questions about your Uyarvom products.
              </p>
              
              {/* Search Bar */}
              <div className="relative max-w-md mx-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="Search for help articles..." 
                  className="pl-10 h-12 rounded-full border-2 border-primary/20 focus:border-primary"
                />
              </div>
            </AppleReveal>
          </div>
        </section>

        {/* Support Channels */}
        <section className="py-16">
          <div className="max-w-[980px] mx-auto px-6">
            <AppleReveal>
              <h2 className="text-3xl font-bold text-center mb-12">Get in Touch</h2>
            </AppleReveal>
            
            <div className="grid gap-6 md:grid-cols-3">
              {supportChannels.map((channel, index) => (
                <AppleReveal key={channel.title} delay={index * 100}>
                  <Card className={`apple-card h-full ${channel.primary ? 'ring-2 ring-primary/20' : ''}`}>
                    <CardHeader className="text-center pb-4">
                      <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                        channel.primary ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                      }`}>
                        <channel.icon className="h-8 w-8" />
                      </div>
                      <CardTitle className="text-xl">{channel.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {channel.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="mb-4">
                        <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-2">
                          <Clock className="h-4 w-4" />
                          {channel.availability}
                        </div>
                        {channel.contact && (
                          <p className="font-medium text-primary">{channel.contact}</p>
                        )}
                      </div>
                      <Button 
                        className={`w-full ${channel.primary ? 'apple-button' : 'apple-button-secondary'}`}
                      >
                        {channel.action}
                      </Button>
                    </CardContent>
                  </Card>
                </AppleReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Help Categories */}
        <section className="py-16 bg-secondary/10">
          <div className="max-w-[980px] mx-auto px-6">
            <AppleReveal>
              <h2 className="text-3xl font-bold text-center mb-12">Browse Help Topics</h2>
            </AppleReveal>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {helpCategories.map((category, index) => (
                <AppleReveal key={category.title} delay={index * 100}>
                  <Card className="apple-card group cursor-pointer apple-hover-lift">
                    <CardHeader className="text-center">
                      <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                        <category.icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {category.title}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {category.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {category.articles} articles
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                </AppleReveal>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16">
          <div className="max-w-[980px] mx-auto px-6">
            <AppleReveal>
              <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
            </AppleReveal>
            
            <div className="grid gap-6 md:grid-cols-2">
              {faqs.map((faq, index) => (
                <AppleReveal key={index} delay={index * 100}>
                  <Card className="apple-card">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-start gap-3">
                        <HelpCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        {faq.question}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="apple-body text-muted-foreground">
                        {faq.answer}
                      </p>
                    </CardContent>
                  </Card>
                </AppleReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="py-16 bg-secondary/10">
          <div className="max-w-[600px] mx-auto px-6">
            <AppleReveal>
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Still Need Help?</h2>
                <p className="apple-body text-muted-foreground">
                  Can't find what you're looking for? Send us a message and we'll get back to you within 2 hours.
                </p>
              </div>
            </AppleReveal>
            
            <AppleReveal delay={200}>
              <Card className="apple-card">
                <CardHeader>
                  <CardTitle>Send us a Message</CardTitle>
                  <CardDescription>
                    Fill out the form below and our support team will respond quickly.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Name</label>
                      <Input placeholder="Your full name" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Email</label>
                      <Input type="email" placeholder="your@email.com" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Subject</label>
                    <Input placeholder="What can we help you with?" />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Message</label>
                    <Textarea 
                      placeholder="Please describe your question or issue in detail..."
                      rows={5}
                    />
                  </div>
                  
                  <Button className="w-full apple-button">
                    Send Message
                  </Button>
                </CardContent>
              </Card>
            </AppleReveal>
          </div>
        </section>

        {/* Customer Satisfaction */}
        <section className="py-16">
          <div className="max-w-[980px] mx-auto px-6 text-center">
            <AppleReveal>
              <div className="flex items-center justify-center gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-6 w-6 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <h3 className="text-2xl font-bold mb-2">98% Customer Satisfaction</h3>
              <p className="apple-body text-muted-foreground max-w-2xl mx-auto">
                Our support team is rated 4.9/5 stars by customers. We're committed to providing exceptional service and resolving your questions quickly.
              </p>
            </AppleReveal>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  )
}