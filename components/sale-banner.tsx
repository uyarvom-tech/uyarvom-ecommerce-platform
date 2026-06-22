'use client'

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowRight, BadgePercent, Gift, Truck } from "lucide-react"

export function SaleBanner() {
  const [timeLeft, setTimeLeft] = useState({ hours: 5, minutes: 10, seconds: 13 })

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 }
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59, hours: prev.hours }
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 }
        return prev
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const perks = [
    { icon: BadgePercent, label: "Up to 30% off selected picks" },
    { icon: Truck, label: "Fast shipping across India" },
    { icon: Gift, label: "Gifting sets shoppers love" },
  ]

  return (
    <section className="border-b border-border/10 bg-[linear-gradient(135deg,#fffaf2_0%,#fff_48%,#f7efe1_100%)]">
      <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 md:py-6">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="overflow-hidden rounded-[28px] border border-[#e9dcc5] bg-[#f7eddc] p-5 shadow-sm md:p-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-white px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
                Limited Time Edit
              </span>
              <span className="rounded-full bg-[#b91c1c] px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.3em] text-white">
                Save More Today
              </span>
            </div>

            <div className="mt-4 max-w-3xl space-y-3">
              <h2 className="mb-0 text-2xl leading-tight md:text-4xl">
                Upgrade your kitchen and dining setup with offer-led bestsellers.
              </h2>
              <p className="max-w-2xl text-xs leading-6 text-muted-foreground md:text-sm">
                Inspired by retail-first merchandising, this section puts the strongest value message up front so shoppers
                instantly see what is hot, what is discounted, and what is worth opening right now.
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/offers" className="apple-button inline-flex h-10 items-center px-5">
                Shop Offers
              </Link>
              <Link
                href="/?sort=newest"
                className="inline-flex h-10 items-center rounded-full border border-foreground/15 bg-white px-5 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                Explore New Arrivals
              </Link>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {perks.map((perk) => (
                <div key={perk.label} className="rounded-2xl border border-white/70 bg-white/70 p-3.5">
                  <perk.icon className="h-5 w-5 text-primary" />
                  <p className="mt-2 text-xs font-semibold text-foreground">{perk.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[28px] border border-border/60 bg-[#111111] p-5 text-white shadow-sm md:p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-primary">Offer Countdown</p>
              <div className="mt-3 flex gap-3">
                {[
                  { value: timeLeft.hours, label: "Hours" },
                  { value: timeLeft.minutes, label: "Mins" },
                  { value: timeLeft.seconds, label: "Secs" },
                ].map((item) => (
                  <div key={item.label} className="min-w-[68px] rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-center">
                    <p className="text-xl font-semibold">{String(item.value).padStart(2, "0")}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-white/55">{item.label}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs leading-6 text-white/70">
                Use code <span className="font-bold text-white">ODS30</span> on selected collections while the timer is live.
              </p>
            </div>

            <div className="rounded-[28px] border border-border/60 bg-white p-5 shadow-sm md:p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-primary">Quick Value Picks</p>
              <div className="mt-3 space-y-2.5">
                {[
                  { title: "Cookware under â‚¹2,999", href: "/?category=cookware&max=2999" },
                  { title: "Gift-ready sets", href: "/?category=gifting-sets" },
                  { title: "Diningware deals", href: "/?category=diningware&sort=price-desc" },
                ].map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="flex items-center justify-between rounded-2xl border border-border/60 bg-secondary/30 px-4 py-3 text-sm font-semibold text-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                  >
                    <span>{item.title}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
