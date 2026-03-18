'use client'

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CATEGORY_FALLBACK_IMAGE } from "@/lib/image-fallbacks"
import { cn } from "@/lib/utils"

export interface StoreNavigationCategory {
  id: string
  name: string
  slug: string
  imageUrl: string | null
  children: Array<{
    id: string
    name: string
    slug: string
  }>
}

type DisplayCategory = {
  id: string
  name: string
  icon: string
  href: string
  children: Array<{
    id: string
    name: string
    href: string
  }>
}

const R2_BASE = 'https://pub-c87cc954ba2e4a289b4f50beaef0560b.r2.dev'

const iconMap: Record<string, string> = {
  sale:          `${R2_BASE}/products/UY-DW-BCN-DES-PLT-PRM.jpeg`,
  "new-in":      `${R2_BASE}/products/UY-SW-STN-BWL-MD-NAT.jpeg`,
  cookware:      `${R2_BASE}/products/UY-KW-CI-SKL-12-PS.jpeg`,
  serveware:     `${R2_BASE}/products/UY-SW-STN-PLT-OVL-NAT.jpeg`,
  diningware:    `${R2_BASE}/products/UY-DW-BCN-DES-PLT-PRM.jpeg`,
  "dining-sets": `${R2_BASE}/products/UY-SW-STN-SAL-LG-NAT.jpeg`,
  storage:       `${R2_BASE}/products/UY-ST-GLS-BOR-01L.jpeg`,
  gifting:       `${R2_BASE}/products/UY-SW-BRS-POJ-PLT-TRD.jpeg`,
}

const displayNameMap: Record<string, string> = {
  cookware: "Cookware",
  serveware: "Serveware",
  diningware: "Diningware",
  storage: "Storage",
  "gifting-sets": "Gifting",
}

export function CategoryNavigation({ categories }: { categories: StoreNavigationCategory[] }) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const displayCategories = useMemo<DisplayCategory[]>(() => {
    const baseCategories: DisplayCategory[] = [
      {
        id: "sale",
        name: "Sale",
        icon: iconMap.sale,
        href: "/offers",
        children: [
          { id: "sale-offers", name: "Today's Offers", href: "/offers" },
          { id: "sale-track", name: "Track Order", href: "/track" },
        ],
      },
      {
        id: "new-in",
        name: "New In",
        icon: iconMap["new-in"],
        href: "/?sort=newest",
        children: [
          { id: "new-arrivals", name: "Latest arrivals", href: "/?sort=newest" },
          { id: "new-gifting", name: "New gifting picks", href: "/?category=gifting-sets&sort=newest" },
        ],
      },
      {
        id: "dining-sets",
        name: "Dining Sets",
        icon: iconMap["dining-sets"],
        href: "/?category=diningware",
        children: [
          { id: "dining-plates", name: "Plates and bowls", href: "/?category=diningware" },
          { id: "dining-serveware", name: "Serve and host", href: "/?category=serveware" },
        ],
      },
    ]

    for (const category of categories) {
      baseCategories.push({
        id: category.id,
        name: displayNameMap[category.slug] || category.name,
        icon: iconMap[category.slug] || category.imageUrl || CATEGORY_FALLBACK_IMAGE,
        href: `/?category=${category.slug}`,
        children: category.children.map((child) => ({
          id: child.id,
          name: child.name,
          href: `/?category=${category.slug}&sub=${child.slug}`,
        })),
      })
    }

    return baseCategories
  }, [categories])

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      if (scrollTop > 100 && !isScrolled) setIsScrolled(true)
      else if (scrollTop < 50 && isScrolled) setIsScrolled(false)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [isScrolled])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setActiveCategory(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const activeCategoryData = displayCategories.find((category) => category.id === activeCategory)

  return (
    <div
      ref={wrapperRef}
      className={cn(
        "relative w-full border-b border-border/40 bg-white",
        isScrolled ? "sticky top-[148px] z-40 bg-white/95 shadow-sm backdrop-blur" : ""
      )}
      onMouseLeave={() => {
        if (!isMobile) setActiveCategory(null)
      }}
    >
      <div className={cn("mx-auto max-w-[1400px] px-4 transition-all duration-300 sm:px-6", isScrolled ? "py-3" : "py-5")}>
        {!isScrolled && (
          <div className="mb-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-primary">Shop By Collection</p>
          </div>
        )}

        <div className="flex items-start gap-3 overflow-x-auto scrollbar-hide md:justify-center md:gap-5">
          {displayCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategory(activeCategory === category.id ? null : category.id)}
              onMouseEnter={() => {
                if (!isMobile) setActiveCategory(category.id)
              }}
              className={cn(
                "group flex min-w-[82px] flex-col items-center transition-all duration-300 md:min-w-[98px]",
                isScrolled ? "px-1 py-0.5" : "px-1 py-0"
              )}
            >
              <div
                className={cn(
                  "relative overflow-hidden rounded-full border border-border/15 bg-secondary shadow-sm transition-all duration-300",
                  isScrolled ? "mb-0 h-0 w-0 scale-0 opacity-0" : "mb-2.5 h-16 w-16 scale-100 opacity-100 md:h-[72px] md:w-[72px]",
                  activeCategory === category.id && !isScrolled ? "border-primary shadow-md" : "group-hover:border-primary/35 group-hover:shadow-md"
                )}
              >
                <Image
                  src={category.icon}
                  alt={category.name}
                  width={96}
                  height={96}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(event) => {
                    const target = event.target as HTMLImageElement
                    target.src = CATEGORY_FALLBACK_IMAGE
                  }}
                />
              </div>
              <span
                className={cn(
                  "text-center text-[10px] font-bold uppercase tracking-[0.24em] text-foreground transition-colors md:text-[11px]",
                  activeCategory === category.id ? "text-primary" : "group-hover:text-primary"
                )}
              >
                {category.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {activeCategoryData && (
        <div
          className={cn(
            "absolute left-0 right-0 top-full z-50 border-t border-border/20 bg-white shadow-xl",
            isMobile ? "fixed inset-x-0 bottom-0 top-auto rounded-t-3xl" : ""
          )}
        >
          {isMobile ? (
            <MobileDropdown category={activeCategoryData} onClose={() => setActiveCategory(null)} />
          ) : (
            <DesktopDropdown category={activeCategoryData} />
          )}
        </div>
      )}

      {isMobile && activeCategory && (
        <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setActiveCategory(null)} />
      )}
    </div>
  )
}

function DesktopDropdown({ category }: { category: DisplayCategory }) {
  return (
    <div className="mx-auto max-w-[1280px] px-8 py-8">
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <div className="space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-primary">Browse</p>
          <h2 className="mb-0 text-4xl text-foreground">{category.name}</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            Open the category directly or jump into the subcollections shoppers usually explore next.
          </p>
          <Link href={category.href} className="apple-button inline-flex h-11 items-center px-7">
            Shop {category.name}
          </Link>
        </div>

        <div className="flex flex-wrap gap-3 content-start">
          {category.children.length > 0 ? (
            category.children.map((child) => (
              <Link
                key={child.id}
                href={child.href}
                className="inline-flex min-h-0 items-center rounded-full border border-border/60 bg-secondary/25 px-5 py-3 text-sm font-medium text-foreground transition-all hover:border-primary/30 hover:bg-primary/5"
              >
                {child.name}
              </Link>
            ))
          ) : (
            <Link
              href={category.href}
              className="inline-flex min-h-0 items-center rounded-full border border-border/60 bg-secondary/25 px-5 py-3 text-sm font-medium text-foreground transition-all hover:border-primary/30 hover:bg-primary/5"
            >
              View {category.name}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

function MobileDropdown({ category, onClose }: { category: DisplayCategory; onClose: () => void }) {
  return (
    <div className="max-h-[85vh] overflow-y-auto rounded-t-3xl bg-background">
      <div className="flex items-center justify-between border-b border-border/10 px-6 py-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-primary">Collection</p>
          <h2 className="mt-1 text-2xl font-serif text-foreground">{category.name}</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="space-y-3 p-6">
        <Link
          href={category.href}
          onClick={onClose}
          className="block rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 text-sm font-semibold text-primary"
        >
          Shop {category.name}
        </Link>

        {category.children.map((child) => (
          <Link
            key={child.id}
            href={child.href}
            onClick={onClose}
            className="block rounded-2xl border border-border/50 bg-secondary/20 px-5 py-4 text-sm font-medium text-foreground"
          >
            {child.name}
          </Link>
        ))}
      </div>
    </div>
  )
}
