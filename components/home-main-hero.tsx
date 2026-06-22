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
    <section className="relative w-full overflow-hidden border-b border-border/10 bg-[#f7f3eb]">
      <div className="relative h-[38vh] min-h-[280px] w-full md:h-[60vh] md:min-h-[500px]">
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
            <div className="absolute inset-0 bg-black/28 md:bg-black/20" />

            <div className="absolute inset-0 flex items-end">
              <div className="w-full px-4 py-7 md:px-12 md:pb-16 lg:px-20 lg:pb-20">
                <div className="max-w-4xl">
                  <p className="mb-2.5 text-[9px] font-black uppercase tracking-[.32em] text-primary drop-shadow-md md:mb-4 md:text-[10px] md:tracking-[.4em]">
                    {slide.eyebrow}
                  </p>
                  <h1 className="max-w-[10ch] font-playfair text-[2.15rem] font-black leading-[0.9] tracking-tighter text-white drop-shadow-2xl md:max-w-none md:text-5xl lg:text-7xl">
                    {slide.title}
                  </h1>
                  <p className="mt-3 max-w-[30ch] text-[12px] leading-relaxed text-white/90 font-medium drop-shadow-lg md:mt-5 md:max-w-2xl md:text-base lg:text-lg">
                    {slide.description}
                  </p>
                  <div className="mt-5 flex flex-col gap-2.5 sm:flex-row md:mt-8 md:gap-3">
                    <Link href={slide.primaryHref} className="flex h-10 items-center justify-center bg-white px-5 text-[10px] font-black uppercase tracking-widest text-black shadow-xl transition-all hover:bg-primary sm:px-8 md:h-11">
                      {slide.primaryLabel}
                    </Link>
                    <Link
                      href={slide.secondaryHref}
                      className="flex h-10 items-center justify-center border border-white/40 bg-white/5 px-5 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md transition-all hover:bg-white/10 sm:px-8 md:h-11"
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
              className="absolute left-6 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 rounded-none border border-white/20 bg-black/10 text-white backdrop-blur-sm transition-all hover:bg-black/40 md:flex"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={goToNext}
              className="absolute right-6 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 rounded-none border border-white/20 bg-black/10 text-white backdrop-blur-sm transition-all hover:bg-black/40 md:flex"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>

            <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-2 md:bottom-7 md:gap-3">
              {activeSlides.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                className={cn(
                    "h-1 transition-all duration-500",
                    activeIndex === index ? "w-10 bg-white md:w-16" : "w-4 bg-white/30 md:w-6"
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
