'use client'

import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ProductCard } from './product-card'
import { Button } from '@/components/ui/button'

interface ProductHorizontalScrollProps {
    title: string
    subtitle?: string
    products: any[]
}

export function ProductHorizontalScroll({ title, subtitle, products }: ProductHorizontalScrollProps) {
    const scrollRef = useRef<HTMLDivElement>(null)

    if (!products || products.length === 0) return null

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollRef.current) return
        const { scrollLeft, clientWidth } = scrollRef.current
        const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth
        scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' })
    }

    return (
        <section className="py-12 md:py-20 border-b border-border/10">
            <div className="mx-auto w-full max-w-[1800px] px-4 sm:px-6 xl:px-8">
                <div className="flex items-end justify-between mb-10">
                    <div>
                        <h2 className="font-playfair text-3xl md:text-5xl font-black tracking-tighter uppercase">{title}</h2>
                        {subtitle && <p className="mt-4 text-muted-foreground text-sm md:text-base font-medium uppercase tracking-[0.2em]">{subtitle}</p>}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => scroll('left')}
                            className="rounded-none h-12 w-12 border-primary/20 hover:bg-primary/5 transition-all"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => scroll('right')}
                            className="rounded-none h-12 w-12 border-primary/20 hover:bg-primary/5 transition-all"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                <div
                    ref={scrollRef}
                    className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {products.map((product) => (
                        <div key={product.id} className="min-w-[280px] w-[280px] sm:min-w-[320px] sm:w-[320px] snap-start">
                            <ProductCard product={product} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
