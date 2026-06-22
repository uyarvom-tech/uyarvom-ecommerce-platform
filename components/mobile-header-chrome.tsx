"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, X } from "lucide-react"
import { HeaderCartButton } from "@/components/header-cart-button"
import { HeaderWishlistButton } from "@/components/header-wishlist-button"
import { ProductsSearch } from "@/components/products-search"
import { Button } from "@/components/ui/button"

const drawerLinks = [
  { label: "Sign In", href: "/auth/signin" },
  { label: "Admin", href: "/auth/admin-login" },
  { label: "Orders", href: "/orders" },
  { label: "Profile", href: "/account" },
]

const categoryLinks = [
  { label: "Sale", href: "/offers" },
  { label: "New In", href: "/?sort=newest" },
  { label: "Cookware", href: "/?category=cookware" },
  { label: "Serveware", href: "/?category=serveware" },
  { label: "Diningware", href: "/?category=diningware" },
  { label: "Storage", href: "/?category=storage" },
  { label: "Gifting", href: "/?category=gifting-sets" },
]

export function MobileHeaderChrome() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  useEffect(() => {
    if (!isDrawerOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsDrawerOpen(false)
    }

    window.addEventListener("keydown", onKeyDown)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [isDrawerOpen])

  return (
    <div className="lg:hidden">
      <div className="border-b border-border/10 bg-[#faf8f2]/95 px-4 py-3 shadow-[0_1px_0_rgba(0,0,0,0.04)] backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsDrawerOpen(true)}
            className="h-10 w-10 rounded-full border border-border/20 bg-white/80 shadow-sm"
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </Button>

          <Link href="/" className="flex min-w-0 flex-1 items-center justify-center gap-2">
            <div className="relative h-9 w-9 overflow-hidden rounded-full border border-primary/10 bg-white shadow-sm">
              <Image src="/logos/logo.png" alt="Uyarvom" fill className="object-contain p-1" priority />
            </div>
            <div className="min-w-0 leading-none">
              <span className="block font-serif text-[1.18rem] tracking-[0.08em] text-[#6b140f]">Uyarvom</span>
              <span className="block font-serif text-[0.72rem] tracking-[0.2em] text-[#b48a2b]">Homestyles</span>
            </div>
          </Link>

          <div className="h-10 w-10" />
        </div>

        <div className="mt-3">
          <ProductsSearch />
        </div>

        <div className="mt-3 flex items-center justify-end gap-3 pr-1">
          <HeaderWishlistButton />
          <HeaderCartButton />
        </div>
      </div>

      <div
        className={`fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          isDrawerOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsDrawerOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={`fixed left-0 top-0 z-[70] h-dvh w-[min(86vw,20rem)] border-r border-border/10 bg-background shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isDrawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!isDrawerOpen}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border/10 px-4 py-4">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-primary">Menu</p>
              <p className="mt-1 text-sm text-muted-foreground">Quick access</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setIsDrawerOpen(false)}
              className="h-10 w-10 rounded-full"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="grid gap-2">
              {drawerLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsDrawerOpen(false)}
                  className="rounded-2xl border border-border/60 bg-white px-4 py-4 text-sm font-semibold text-foreground shadow-sm active:scale-[0.99]"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="mt-6">
              <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-muted-foreground">Categories</p>
              <div className="mt-3 grid gap-2">
                {categoryLinks.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsDrawerOpen(false)}
                    className="rounded-2xl border border-border/50 bg-secondary/25 px-4 py-3 text-sm font-medium text-foreground active:scale-[0.99]"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
