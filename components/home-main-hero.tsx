'use client'

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface HeroBannerProps {
  id: string
  title: string
  subtitle?: string
  imageUrl: string
  linkUrl?: string
  buttonText?: string
}

export function HomeMainHero({ banners = [] }: { banners?: HeroBannerProps[] }) {
  const [activeIndex, setActiveIndex] = useState(0)

  // Use dynamic banners if available, otherwise fallback to static slides
  const activeSlides = banners.length > 0 ? banners.map(b => ({
    image: b.imageUrl,
    eyebrow: "Featured Collection",
    title: b.title,
    description: b.subtitle || "Handcrafted character and strong everyday utility.",
    primaryHref: b.linkUrl || "/search",
    primaryLabel: b.buttonText || "Shop Now",
    secondaryHref: "/search",
    secondaryLabel: "Explore All"
  })) : defaultSlides

  useEffect(() => {
    if (activeSlides.length <= 1) return
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % activeSlides.length)
    }, 5500)

    return () => window.clearInterval(timer)
  }, [activeSlides.length])

  const goToPrev = () => setActiveIndex((current) => (current - 1 + activeSlides.length) % activeSlides.length)
  const goToNext = () => setActiveIndex((current) => (current + 1) % activeSlides.length)

  return (
    <section className="relative w-full overflow-hidden border-b border-border/10">
      <div className="relative h-[54vh] min-h-[380px] w-full md:h-[64vh] md:min-h-[500px]">
        {activeSlides.map((slide, index) => (
          <div
            key={index}
            className={cn(
              "absolute inset-0 transition-opacity duration-1000",
              activeIndex === index ? "opacity-100" : "pointer-events-none opacity-0"
            )}
          >
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              priority={index === 0}
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-black/30 md:bg-black/20" />

            <div className="absolute inset-0 flex items-center md:items-end">
              <div className="w-full px-6 py-10 md:px-12 md:pb-16 lg:px-20 lg:pb-24">
                <div className="max-w-4xl">
                  <p className="text-[10px] font-black uppercase tracking-[.4em] text-primary mb-4 drop-shadow-md">
                    {slide.eyebrow}
                  </p>
                  <h1 className="font-playfair text-4xl md:text-6xl lg:text-8xl font-black leading-[0.9] text-white tracking-tighter drop-shadow-2xl">
                    {slide.title}
                  </h1>
                  <p className="mt-5 max-w-2xl text-sm md:text-base leading-relaxed text-white/90 font-medium drop-shadow-lg lg:text-lg">
                    {slide.description}
                  </p>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Link href={slide.primaryHref} className="h-12 bg-white text-black px-8 flex items-center justify-center text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all shadow-xl">
                      {slide.primaryLabel}
                    </Link>
                    <Link
                      href={slide.secondaryHref}
                      className="h-12 border border-white/40 bg-white/5 backdrop-blur-md text-white px-8 flex items-center justify-center text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                    >
                      {slide.secondaryLabel}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {activeSlides.length > 1 && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={goToPrev}
              className="absolute left-6 top-1/2 z-10 h-12 w-12 -translate-y-1/2 rounded-none border border-white/20 bg-black/10 text-white backdrop-blur-sm hover:bg-black/40 transition-all hidden md:flex"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={goToNext}
              className="absolute right-6 top-1/2 z-10 h-12 w-12 -translate-y-1/2 rounded-none border border-white/20 bg-black/10 text-white backdrop-blur-sm hover:bg-black/40 transition-all hidden md:flex"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>

            <div className="absolute bottom-7 left-1/2 z-10 flex -translate-x-1/2 gap-3">
              {activeSlides.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={cn(
                    "h-1 transition-all duration-500",
                    activeIndex === index ? "w-16 bg-white" : "w-6 bg-white/30"
                  )}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}

const R2_BASE = 'https://pub-c87cc954ba2e4a289b4f50beaef0560b.r2.dev'

const defaultSlides = [
  {
    image: `${R2_BASE}/products/UY-DW-BCN-DES-PLT-PRM.jpeg`,
    eyebrow: "Diningware Spotlight",
    title: "SET A TABLE PEOPLE REMEMBER.",
    description: "Serveware and dining pieces styled to make everyday meals feel hosted.",
    primaryHref: "/?category=diningware",
    primaryLabel: "Shop Diningware",
    secondaryHref: "/?category=serveware",
    secondaryLabel: "Explore Serveware",
  },
  {
    image: `${R2_BASE}/products/UY-KW-CI-SKL-12-PS.jpeg`,
    eyebrow: "Cookware Edit",
    title: "Handcrafted character utility.",
    description: "Bring home kitchen essentials with handcrafted character and strong everyday utility.",
    primaryHref: "/?category=cookware",
    primaryLabel: "Shop Cookware",
    secondaryHref: "/offers",
    secondaryLabel: "See Offers",
  }
]
