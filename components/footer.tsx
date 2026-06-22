import Link from "next/link"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="bg-background border-t border-border/40 overflow-hidden">
      <div className="w-full border-b border-border/10 bg-secondary/10 py-12 md:py-16">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-8 text-center sm:grid-cols-2 md:grid-cols-4 md:gap-12 md:text-left">
            {[
              { title: "Heritage Verified", desc: "Sourced from Indian artisan communities." },
              { title: "Careful Delivery", desc: "Packed securely for safe delivery across India." },
              { title: "Easy Support", desc: "Our team is here to help before and after your order." },
              { title: "Handcrafted Quality", desc: "Each piece is made with care and attention to detail." },
            ].map((item, i) => (
              <div key={i} className="space-y-4 group">
                <div className="text-primary group-hover:scale-110 transition-transform duration-500">
                  <div className="h-6 w-[1px] bg-primary mb-4" />
                </div>
                <h5 className="text-[10px] font-bold uppercase tracking-[0.32em] text-foreground md:tracking-[0.4em]">{item.title}</h5>
                <p className="mx-auto max-w-[180px] text-[9px] font-bold uppercase tracking-widest leading-relaxed text-foreground/40">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6 md:py-24">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-20">
          <div className="space-y-8 md:space-y-12">
            <Link href="/" className="flex items-center gap-4 group md:gap-6">
              <div className="relative h-12 w-12 overflow-hidden border border-border/10 transition-all duration-700 group-hover:border-primary/30 md:h-14 md:w-14">
                <Image
                  src="/logos/logo.png"
                  alt="Uyarvom"
                  fill
                  className="object-contain transition-transform duration-700 group-hover:scale-110"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-xl font-medium tracking-tight text-foreground md:text-2xl">
                  Uyar <span className="text-primary italic">vom</span>
                </span>
                <span className="text-[8px] font-bold uppercase tracking-[0.32em] text-foreground/40 -mt-1 md:tracking-[0.4em]">
                  Artisanal Heritage
                </span>
              </div>
            </Link>
            <p className="text-foreground/60 text-sm leading-relaxed max-w-xs font-light">
              Elevating everyday living through artisanal ceramics. Handcrafted pieces for modern homes, inspired by Indian traditions.
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {["Instagram", "Pinterest", "Facebook"].map((social) => (
                <Link key={social} href="#" className="text-[10px] uppercase tracking-[0.2em] font-bold text-foreground/40 hover:text-primary transition-all duration-500">
                  {social}
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-10">
            <h4 className="text-primary text-[10px] font-bold uppercase tracking-[0.4em]">Shop</h4>
            <ul className="space-y-6">
              {[
                { label: "All Products", href: "/products" },
                { label: "New Arrivals", href: "/products?sort=newest" },
                { label: "Cookware", href: "/?category=cookware" },
                { label: "Diningware", href: "/?category=diningware" },
                { label: "Gifting Sets", href: "/?category=gifting-sets" },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-foreground/70 hover:text-primary text-[10px] uppercase tracking-[0.2em] font-bold transition-all duration-500">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-10">
            <h4 className="text-primary text-[10px] font-bold uppercase tracking-[0.4em]">Help</h4>
            <ul className="space-y-6">
              {[
                { label: "About Us", href: "/about" },
                { label: "AI Kitchen Match", href: "/?tab=ai-match" },
                { label: "Track Order", href: "/track" },
                { label: "Delivery Information", href: "/delivery" },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-foreground/70 hover:text-primary text-[10px] uppercase tracking-[0.2em] font-bold transition-all duration-500">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-10">
            <h4 className="text-primary text-[10px] font-bold uppercase tracking-[0.4em]">Policies</h4>
            <ul className="space-y-6">
              {[
                { label: "Shipping", href: "/shipping" },
                { label: "Returns & Exchanges", href: "/returns" },
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Support", href: "/support" },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-foreground/70 hover:text-primary text-[10px] uppercase tracking-[0.2em] font-bold transition-all duration-500">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 border-t border-border/10 pt-10 md:mt-24 md:pt-12">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row md:gap-10">
            <div className="flex flex-col gap-2">
              <p className="text-foreground/40 text-[9px] uppercase tracking-[0.2em] font-bold">
                &copy; {new Date().getFullYear()} Uyarvom. All Rights Reserved.
              </p>
              <p className="text-foreground/20 text-[8px] uppercase tracking-[0.1em] font-bold">
                Handcrafted in India.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 md:gap-12">
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
                <p className="text-foreground/40 text-[9px] uppercase tracking-[0.2em] font-bold whitespace-nowrap">
                  Origin: Khurja & Rajasthan
                </p>
              </div>
              <p className="text-foreground/40 text-[9px] uppercase tracking-[0.2em] font-bold hidden lg:block">
                Secure delivery across India
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
