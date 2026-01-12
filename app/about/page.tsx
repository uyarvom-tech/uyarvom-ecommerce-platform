import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Award, Heart, Leaf, Shield, Truck, Users } from "lucide-react"
import Link from "next/link"
import ScrollFloat from "@/components/ScrollFloat"
import TiltedCard from "@/components/tilted-card"
import SpotlightCard from "@/components/SpotlightCard"
import { AppleReveal } from "@/components/apple-scroll-animations"
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
              <AppleReveal>
                <div>
                  <ScrollFloat
                    animationDuration={1.2}
                    ease="back.inOut(2)"
                    scrollStart="center bottom+=50%"
                    scrollEnd="bottom bottom-=40%"
                    stagger={0.02}
                    className="font-serif text-4xl font-bold tracking-tight md:text-6xl leading-tight"
                  >
                    Crafting Excellence Since Day One
                  </ScrollFloat>
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
              </AppleReveal>
              <AppleReveal delay={200}>
                <SpotlightCard 
                  className="w-full max-w-md mx-auto" 
                  spotlightColor="rgba(245, 158, 11, 0.3)"
                >
                  <div className="w-full max-w-md">
                    <TiltedCard
                      imageSrc="/images/about/value-handcrafted-love.png"
                      altText="Uyarvom ceramic craftsmanship - artisan hands shaping clay pottery"
                      captionText=""
                      containerHeight="400px"
                      containerWidth="400px"
                      imageHeight="400px"
                      imageWidth="400px"
                      rotateAmplitude={8}
                      scaleOnHover={1.05}
                      showMobileWarning={false}
                      showTooltip={false}
                      displayOverlayContent={false}
                      className="mx-auto"
                    />
                  </div>
                </SpotlightCard>
              </AppleReveal>
            </div>
          </div>
        </section>

        {/* Values Section with TiltedCards */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto max-w-7xl px-6">
            <AppleReveal>
              <div className="text-center">
                <ScrollFloat
                  animationDuration={1}
                  ease="back.inOut(2)"
                  scrollStart="center bottom+=30%"
                  scrollEnd="bottom bottom-=30%"
                  stagger={0.03}
                  className="font-serif text-3xl font-bold tracking-tight md:text-4xl"
                >
                  What We Stand For
                </ScrollFloat>
                <p className="mt-4 text-muted-foreground">The values that guide everything we create</p>
              </div>
            </AppleReveal>
            
            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 place-items-center">
              {[
                {
                  icon: Heart,
                  title: "Handcrafted with Love",
                  description: "Each piece is carefully crafted by skilled artisans who pour their passion into every detail, ensuring exceptional quality.",
                  image: "/images/about/value-handcrafted-love.png",
                  delay: 100
                },
                {
                  icon: Leaf,
                  title: "Sustainable Materials",
                  description: "We use eco-friendly, non-toxic materials and sustainable production methods to protect our planet for future generations.",
                  image: "/images/about/value-sustainable-materials.png",
                  delay: 200
                },
                {
                  icon: Award,
                  title: "Premium Quality",
                  description: "Every product undergoes rigorous quality checks to ensure it meets our exacting standards for durability and performance.",
                  image: "/images/about/value-premium-quality.png",
                  delay: 300
                },
                {
                  icon: Users,
                  title: "Community First",
                  description: "We support local artisan communities and fair trade practices, ensuring every purchase makes a positive impact.",
                  image: "/images/about/value-community-first.png",
                  delay: 400
                },
                {
                  icon: Shield,
                  title: "Lifetime Warranty",
                  description: "We stand behind our products with a comprehensive lifetime warranty, because quality should last generations.",
                  image: "/images/about/value-lifetime-warranty.png",
                  delay: 500
                },
                {
                  icon: Truck,
                  title: "Free Shipping",
                  description: "Enjoy complimentary shipping on all orders within India, with careful packaging to ensure safe delivery.",
                  image: "/images/about/value-free-shipping.png",
                  delay: 600
                }
              ].map((value, index) => {
                const IconComponent = value.icon
                return (
                  <AppleReveal key={index} delay={value.delay}>
                    <div className="w-full max-w-sm">
                      <TiltedCard
                        imageSrc={value.image}
                        altText={`${value.title} - Uyarvom values`}
                        captionText={value.title}
                        containerHeight="280px"
                        containerWidth="320px"
                        imageHeight="240px"
                        imageWidth="320px"
                        rotateAmplitude={8}
                        scaleOnHover={1.05}
                        showMobileWarning={false}
                        showTooltip={true}
                        displayOverlayContent={true}
                        overlayContent={
                          <div className="text-white text-center w-full p-6">
                            <div className="mb-4 inline-flex rounded-full bg-white/20 backdrop-blur-sm p-3">
                              <IconComponent className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                            <p className="text-sm opacity-90 leading-relaxed">{value.description}</p>
                          </div>
                        }
                        className="mx-auto"
                      />
                    </div>
                  </AppleReveal>
                )
              })}
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="border-t bg-background py-16 md:py-24">
          <div className="container mx-auto max-w-7xl px-6">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <AppleReveal delay={200}>
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl lg:order-2">
                  <Image 
                    src="/images/about/story-ceramic-collection.png" 
                    alt="Beautiful ceramic dinnerware set showcasing our craftsmanship" 
                    fill 
                    className="object-cover" 
                  />
                </div>
              </AppleReveal>
              <AppleReveal>
                <div className="lg:order-1">
                  <ScrollFloat
                    animationDuration={1}
                    ease="back.inOut(2)"
                    scrollStart="center bottom+=30%"
                    scrollEnd="bottom bottom-=30%"
                    stagger={0.04}
                    className="font-serif text-3xl font-bold tracking-tight md:text-4xl"
                  >
                    Our Story
                  </ScrollFloat>
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
              </AppleReveal>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t py-16">
          <div className="container mx-auto max-w-7xl px-6 text-center">
            <AppleReveal>
              <ScrollFloat
                animationDuration={1}
                ease="back.inOut(2)"
                scrollStart="center bottom+=30%"
                scrollEnd="bottom bottom-=30%"
                stagger={0.03}
                className="font-serif text-3xl font-bold tracking-tight"
              >
                Ready to Transform Your Kitchen?
              </ScrollFloat>
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
            </AppleReveal>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
