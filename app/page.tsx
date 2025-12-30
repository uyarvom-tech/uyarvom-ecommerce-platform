import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { ArrowRight, Star, Sparkles, ChevronRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AppleReveal, AppleParallax } from "@/components/apple-scroll-animations"
import ScrollStack, { ScrollStackItem } from "@/components/scroll-stack"
import ScrollFloat from "@/components/ScrollFloat"
import { CustomerReviewsLoop } from "@/components/customer-reviews-loop"

export default async function HomePage() {
  // Fetch featured products from database
  const featuredProducts = await prisma.product.findMany({
    where: {
      isActive: true,
      isFeatured: true
    },
    include: {
      productCategories: {
        include: { category: true },
        orderBy: { isPrimary: 'desc' }
      },
      images: {
        orderBy: { sortOrder: 'asc' }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 6
  })

  // Fetch active categories for the showcase
  const showcaseCategories = await prisma.category.findMany({
    where: {
      isActive: true,
      parentId: null // Only root categories
    },
    orderBy: [
      { displayOrder: 'asc' },
      { name: 'asc' }
    ],
    take: 4 // Show top 4 categories in the scroll stack
  })

  // Define colors for category showcase
  const categoryColors = [
    { hover: 'group-hover:text-amber-200', text: 'text-amber-200' },
    { hover: 'group-hover:text-blue-200', text: 'text-blue-200' },
    { hover: 'group-hover:text-green-200', text: 'text-green-200' },
    { hover: 'group-hover:text-purple-200', text: 'text-purple-200' }
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background apple-scroll-snap">
      <Header />

      {/* Apple-style Hero Section */}
      <section className="py-8 md:py-12 lg:py-16 relative overflow-hidden">
        <AppleParallax speed={0.3} className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-secondary/20 via-background to-background"></div>
        </AppleParallax>
        
        {/* Background Logo */}
        <div className="absolute inset-0 flex items-center justify-center z-0">
          <Image
            src="/logos/logo.png"
            alt=""
            width={500}
            height={500}
            className="w-[700px] h-[700px] opacity-15 object-contain"
          />
        </div>
        
        <div className="max-w-[980px] mx-auto px-6 text-center relative z-10">
          <AppleReveal delay={200}>
            <ScrollFloat
              animationDuration={1.2}
              ease="back.inOut(2)"
              scrollStart="center bottom+=50%"
              scrollEnd="bottom bottom-=40%"
              stagger={0.02}
              className="text-4xl md:text-6xl lg:text-7xl font-semibold tracking-tight mb-8 max-w-5xl mx-auto"
            >
              Transform Every Meal Into a Masterpiece
            </ScrollFloat>
          </AppleReveal>

          <AppleReveal delay={400}>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
              Join 10,000+ home chefs who've elevated their cooking with our premium ceramic cookware. 
              Handcrafted for perfection, designed to last generations.
            </p>
          </AppleReveal>

          <AppleReveal delay={600}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button size="lg" className="h-14 px-8 text-[17px] rounded-full" asChild>
                <Link href="/products">
                  Explore Collection
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-8 text-[17px] rounded-full"
                asChild
              >
                <Link href="/categories">Browse Categories</Link>
              </Button>
            </div>
          </AppleReveal>

          <AppleReveal delay={800}>
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span>4.9/5 from 2,847 reviews</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-white"></div>
                </div>
                <span>10,000+ Happy Customers</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Featured in 15+ Publications</span>
              </div>
            </div>
          </AppleReveal>
        </div>
      </section>

      {/* Apple-style Announcement Bar */}
      <section className="bg-primary text-primary-foreground py-4">
        <div className="max-w-[980px] mx-auto px-6">
          <AppleReveal>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-center">
              <span className="font-semibold">Limited Time:</span>
              <span>Get 20% OFF on your first purchase + Free Shipping</span>
              <span className="text-primary-foreground/80">Code: WELCOME20</span>
              <ChevronRight className="h-4 w-4 hidden sm:block" />
            </div>
          </AppleReveal>
        </div>
      </section>

      {/* Scroll Stack Collection Showcase */}
      <ScrollStack className="">
        {showcaseCategories.map((category, index) => {
          const colors = categoryColors[index] || categoryColors[0]
          return (
            <ScrollStackItem key={category.id}>
              <Link href={`/products?category=${category.slug}`} className="block w-full h-full cursor-pointer group relative z-10">
                <div className="text-center h-full flex flex-col justify-center transition-transform duration-300 group-hover:scale-105 relative z-10">
                  <ScrollFloat
                    animationDuration={1}
                    ease="back.inOut(2)"
                    scrollStart="center bottom+=30%"
                    scrollEnd="bottom bottom-=30%"
                    stagger={0.02}
                    className={`text-4xl md:text-6xl font-bold mb-6 text-white drop-shadow-lg ${colors.hover} transition-colors`}
                  >
                    {category.name}
                  </ScrollFloat>
                  <p className="text-xl md:text-2xl text-white/90 max-w-4xl mx-auto group-hover:text-white transition-colors drop-shadow-md leading-relaxed">
                    {category.description || `Discover our premium ${category.name.toLowerCase()} collection. Quality craftsmanship meets modern design.`}
                  </p>
                  <div className={`mt-8 text-lg font-semibold text-white/80 ${colors.hover} transition-colors drop-shadow-md`}>
                    Click to Explore →
                  </div>
                </div>
              </Link>
            </ScrollStackItem>
          )
        })}
      </ScrollStack>

      {/* Apple-style Testimonials with Scrolling Reviews */}
      <section className="py-20 md:py-32 bg-secondary/10 overflow-hidden">
        <div className="max-w-[980px] mx-auto px-6">
          <AppleReveal>
            <div className="text-center mb-16">
              <ScrollFloat
                animationDuration={1}
                ease="back.inOut(2)"
                scrollStart="center bottom+=30%"
                scrollEnd="bottom bottom-=30%"
                stagger={0.03}
                className="text-3xl md:text-5xl font-semibold tracking-tight mb-4"
              >
                Loved by Home Chefs Everywhere
              </ScrollFloat>
              <p className="text-xl text-muted-foreground">Don't just take our word for it</p>
            </div>
          </AppleReveal>
        </div>

        {/* Full-width scrolling reviews */}
        <AppleReveal delay={200}>
          <CustomerReviewsLoop className="mt-12 -mx-6 md:-mx-0" />
        </AppleReveal>
      </section>

      {/* Apple-style Features */}
      <section className="py-20 md:py-32">
        <div className="max-w-[980px] mx-auto px-6">
          <AppleReveal>
            <div className="text-center mb-16">
              <ScrollFloat
                animationDuration={1}
                ease="back.inOut(2)"
                scrollStart="center bottom+=30%"
                scrollEnd="bottom bottom-=30%"
                stagger={0.03}
                className="text-3xl md:text-5xl font-semibold tracking-tight mb-4"
              >
                Why 10,000+ Customers Trust Uyarvom
              </ScrollFloat>
              <p className="text-xl text-muted-foreground">Exceptional quality backed by unmatched service</p>
            </div>
          </AppleReveal>

          <div className="grid gap-12 md:grid-cols-3">
            {[
              {
                icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
                title: "Lifetime Warranty",
                description: "Every piece is backed by our lifetime warranty. If it breaks, we'll replace it—no questions asked.",
                delay: 200
              },
              {
                icon: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z",
                title: "100% Secure Checkout",
                description: "Your payment information is encrypted and secure. We never store your card details.",
                delay: 400
              },
              {
                icon: "M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12",
                title: "Fast & Free Delivery",
                description: "Free shipping on orders over ₹999. Most orders arrive within 3-5 business days.",
                delay: 600
              }
            ].map((feature, index) => (
              <AppleReveal key={index} delay={feature.delay}>
                <div className="text-center">
                  <div className="mb-6 mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center">
                    <svg className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={feature.icon} />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-semibold mb-4">{feature.title}</h3>
                  <p className="text-[17px] leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </AppleReveal>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}