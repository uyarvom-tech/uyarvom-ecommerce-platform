import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Award, Heart, Leaf, Shield, Truck, Users } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export const metadata = {
  title: "About Us | Uyarvom",
  description: "Learn about Uyarvom's mission to bring handcrafted ceramic excellence to every kitchen",
}

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-background to-primary/5">
        {/* Hero Section */}
        <section className="border-b bg-background">
          <div className="container mx-auto max-w-7xl px-6 py-16 md:py-24">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <h1 className="font-serif text-4xl font-bold tracking-tight text-balance md:text-6xl">
                  Crafting Excellence Since Day One
                </h1>
                <p className="mt-6 text-lg leading-relaxed text-muted-foreground text-pretty">
                  At Uyarvom, we believe that the tools you cook with matter as much as the ingredients you choose. Our
                  handcrafted ceramic cookware combines traditional craftsmanship with modern design, bringing beauty
                  and functionality to every kitchen.
                </p>
                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <Link
                    href="/products"
                    className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Shop Now
                  </Link>
                  <Link
                    href="/categories"
                    className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-8 font-medium transition-colors hover:bg-accent"
                  >
                    Explore Collections
                  </Link>
                </div>
              </div>
              <div className="relative aspect-square overflow-hidden rounded-2xl">
                <Image
                  src="/ceramic-pottery-workshop-artisan-crafting.jpg"
                  alt="Uyarvom ceramic craftsmanship"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto max-w-7xl px-6">
            <div className="text-center">
              <h2 className="font-serif text-3xl font-bold tracking-tight md:text-4xl">What We Stand For</h2>
              <p className="mt-4 text-muted-foreground">The values that guide everything we create</p>
            </div>
            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="border-2">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex rounded-full bg-primary/10 p-3">
                    <Heart className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-serif text-xl font-bold">Handcrafted with Love</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Each piece is carefully crafted by skilled artisans who pour their passion into every detail,
                    ensuring exceptional quality.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex rounded-full bg-primary/10 p-3">
                    <Leaf className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-serif text-xl font-bold">Sustainable Materials</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    We use eco-friendly, non-toxic materials and sustainable production methods to protect our planet
                    for future generations.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex rounded-full bg-primary/10 p-3">
                    <Award className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-serif text-xl font-bold">Premium Quality</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Every product undergoes rigorous quality checks to ensure it meets our exacting standards for
                    durability and performance.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex rounded-full bg-primary/10 p-3">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-serif text-xl font-bold">Community First</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    We support local artisan communities and fair trade practices, ensuring every purchase makes a
                    positive impact.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex rounded-full bg-primary/10 p-3">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-serif text-xl font-bold">Lifetime Warranty</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    We stand behind our products with a comprehensive lifetime warranty, because quality should last
                    generations.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex rounded-full bg-primary/10 p-3">
                    <Truck className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-serif text-xl font-bold">Free Shipping</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Enjoy complimentary shipping on all orders within India, with careful packaging to ensure safe
                    delivery.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="border-t bg-background py-16 md:py-24">
          <div className="container mx-auto max-w-7xl px-6">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl lg:order-2">
                <Image src="/ceramic-cookware-in-modern-kitchen.jpg" alt="Our story" fill className="object-cover" />
              </div>
              <div className="lg:order-1">
                <h2 className="font-serif text-3xl font-bold tracking-tight md:text-4xl">Our Story</h2>
                <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    Uyarvom was born from a simple belief: that cooking should be a joyful experience, and the tools you
                    use should inspire creativity while standing the test of time.
                  </p>
                  <p>
                    Founded by a team of design enthusiasts and culinary experts, we set out to create ceramic cookware
                    that combines the warmth of traditional craftsmanship with the precision of modern engineering.
                  </p>
                  <p>
                    Today, Uyarvom products are found in kitchens across India, helping home cooks and professional
                    chefs alike create memorable meals with cookware they can trust and treasure.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t py-16">
          <div className="container mx-auto max-w-7xl px-6 text-center">
            <h2 className="font-serif text-3xl font-bold tracking-tight">Ready to Transform Your Kitchen?</h2>
            <p className="mt-4 text-muted-foreground">
              Explore our collection and discover the perfect ceramic pieces for your culinary journey
            </p>
            <div className="mt-8">
              <Link
                href="/products"
                className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Start Shopping
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
