// @ts-nocheck
'use client'

import LogoLoop from './LogoLoop'
import { Star } from 'lucide-react'

const customerReviews = [
  {
    node: (
      <div className="group cursor-pointer transform transition-all duration-300 hover:scale-105 hover:-rotate-1">
        <div className="bg-card/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border min-w-[320px] max-w-[320px] h-[200px] flex flex-col justify-between hover:shadow-xl transition-all duration-300">
          <div>
            <div className="flex items-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-card-foreground text-sm leading-relaxed mb-4">
              "Absolutely love my new cookware set! The quality is outstanding and it heats so evenly. Best kitchen investment I've made."
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/30 flex items-center justify-center font-semibold text-primary text-sm">
              PA
            </div>
            <div>
              <p className="font-semibold text-card-foreground text-sm">Priya Anand</p>
              <p className="text-xs text-muted-foreground">Verified Buyer</p>
            </div>
          </div>
        </div>
      </div>
    ),
    title: "Priya Anand Review"
  },
  {
    node: (
      <div className="group cursor-pointer transform transition-all duration-300 hover:scale-105 hover:rotate-1">
        <div className="bg-card/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border min-w-[320px] max-w-[320px] h-[200px] flex flex-col justify-between hover:shadow-xl transition-all duration-300">
          <div>
            <div className="flex items-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-card-foreground text-sm leading-relaxed mb-4">
              "The craftsmanship is exceptional. You can tell these are made to last. Plus the customer service is top-notch!"
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/30 flex items-center justify-center font-semibold text-primary text-sm">
              RK
            </div>
            <div>
              <p className="font-semibold text-card-foreground text-sm">Rajesh Kumar</p>
              <p className="text-xs text-muted-foreground">Verified Buyer</p>
            </div>
          </div>
        </div>
      </div>
    ),
    title: "Rajesh Kumar Review"
  },
  {
    node: (
      <div className="group cursor-pointer transform transition-all duration-300 hover:scale-105 hover:-rotate-1">
        <div className="bg-card/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border min-w-[320px] max-w-[320px] h-[200px] flex flex-col justify-between hover:shadow-xl transition-all duration-300">
          <div>
            <div className="flex items-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-card-foreground text-sm leading-relaxed mb-4">
              "Beautiful products that actually work great too! They've transformed my cooking experience and look stunning in my kitchen."
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/30 flex items-center justify-center font-semibold text-primary text-sm">
              SM
            </div>
            <div>
              <p className="font-semibold text-card-foreground text-sm">Sneha Malhotra</p>
              <p className="text-xs text-muted-foreground">Verified Buyer</p>
            </div>
          </div>
        </div>
      </div>
    ),
    title: "Sneha Malhotra Review"
  },
  {
    node: (
      <div className="group cursor-pointer transform transition-all duration-300 hover:scale-105 hover:rotate-1">
        <div className="bg-card/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border min-w-[320px] max-w-[320px] h-[200px] flex flex-col justify-between hover:shadow-xl transition-all duration-300">
          <div>
            <div className="flex items-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-card-foreground text-sm leading-relaxed mb-4">
              "Perfect for my daily cooking needs. The ceramic heats evenly and cleans up so easily. Highly recommend!"
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/30 flex items-center justify-center font-semibold text-primary text-sm">
              AV
            </div>
            <div>
              <p className="font-semibold text-card-foreground text-sm">Arjun Verma</p>
              <p className="text-xs text-muted-foreground">Verified Buyer</p>
            </div>
          </div>
        </div>
      </div>
    ),
    title: "Arjun Verma Review"
  },
  {
    node: (
      <div className="group cursor-pointer transform transition-all duration-300 hover:scale-105 hover:-rotate-1">
        <div className="bg-card/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border min-w-[320px] max-w-[320px] h-[200px] flex flex-col justify-between hover:shadow-xl transition-all duration-300">
          <div>
            <div className="flex items-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-card-foreground text-sm leading-relaxed mb-4">
              "Amazing quality and beautiful design. These pieces have become the centerpiece of my kitchen. Worth every penny!"
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/30 flex items-center justify-center font-semibold text-primary text-sm">
              KS
            </div>
            <div>
              <p className="font-semibold text-card-foreground text-sm">Kavya Sharma</p>
              <p className="text-xs text-muted-foreground">Verified Buyer</p>
            </div>
          </div>
        </div>
      </div>
    ),
    title: "Kavya Sharma Review"
  },
  {
    node: (
      <div className="group cursor-pointer transform transition-all duration-300 hover:scale-105 hover:rotate-1">
        <div className="bg-card/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border min-w-[320px] max-w-[320px] h-[200px] flex flex-col justify-between hover:shadow-xl transition-all duration-300">
          <div>
            <div className="flex items-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-card-foreground text-sm leading-relaxed mb-4">
              "Fast delivery and excellent packaging. The products exceeded my expectations. Will definitely order again!"
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/30 flex items-center justify-center font-semibold text-primary text-sm">
              DG
            </div>
            <div>
              <p className="font-semibold text-card-foreground text-sm">Dev Gupta</p>
              <p className="text-xs text-muted-foreground">Verified Buyer</p>
            </div>
          </div>
        </div>
      </div>
    ),
    title: "Dev Gupta Review"
  }
]

interface CustomerReviewsLoopProps {
  className?: string
}

export function CustomerReviewsLoop({ className = "" }: CustomerReviewsLoopProps) {
  return (
    <div className={`relative overflow-hidden w-screen ${className}`}>
      <div className="absolute left-0 top-0 bottom-0 w-32 md:w-48 bg-gradient-to-r from-background via-background/90 via-background/60 to-transparent z-10 pointer-events-none"></div>
      <div className="absolute right-0 top-0 bottom-0 w-32 md:w-48 bg-gradient-to-l from-background via-background/90 via-background/60 to-transparent z-10 pointer-events-none"></div>
      <LogoLoop
        logos={customerReviews}
        speed={60}
        direction="left"
        logoHeight={200}
        gap={24}
        hoverSpeed={20}
        fadeOut={false}
        ariaLabel="Customer reviews"
        className="py-4"
      />
    </div>
  )
}