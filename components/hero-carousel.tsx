'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const slides = [
    {
        image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?q=80&w=2070&auto=format&fit=crop",
        title: "Timeless Artistry for the Modern Space.",
        description: "A fusion of heritage materials and contemporary architectural vision, curated for those who appreciate the soul of craftsmanship.",
        label: "The Eternal Collection"
    },
    {
        image: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=2070&auto=format&fit=crop",
        title: "Sculpted by Hand, Perfected by Fire.",
        description: "Each piece carries the mark of the artisan, brought to life through ancient firing techniques and natural glazes.",
        label: "Artisan Mastery"
    },
    {
        image: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=2070&auto=format&fit=crop",
        title: "Ethereal Forms in Natural Stone.",
        description: "Discover our collection of raw, organic textures that bring the grounding essence of the earth into your sanctuary.",
        label: "Organic Textures"
    },
    {
        image: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=2070&auto=format&fit=crop",
        title: "Ancestral Kilns, Modern Vision.",
        description: "Every stroke is a story, every piece a legacy. Experience the profound depth of traditional Indian ceramic artistry.",
        label: "Heritage Legacy"
    },
    {
        image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?q=80&w=2070&auto=format&fit=crop",
        title: "The Sanctuary of Craftsmanship.",
        description: "Creating spaces that breathe. Our curated artifacts turn a house into an artisanal home.",
        label: "Artisan Living"
    }
]

export function HeroCarousel() {
    const [currentSlide, setCurrentSlide] = useState(0)
    const [isAnimating, setIsAnimating] = useState(false)

    useEffect(() => {
        const timer = setInterval(() => {
            handleNext()
        }, 6000)
        return () => clearInterval(timer)
    }, [currentSlide])

    const handleNext = () => {
        if (isAnimating) return
        setIsAnimating(true)
        setCurrentSlide((prev) => (prev + 1) % slides.length)
        setTimeout(() => setIsAnimating(false), 1000)
    }

    const handlePrev = () => {
        if (isAnimating) return
        setIsAnimating(true)
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
        setTimeout(() => setIsAnimating(false), 1000)
    }

    return (
        <section className="relative h-[95vh] w-full overflow-hidden bg-ebony">
            {/* Editorial Progress Bar */}
            <div className="absolute top-0 left-0 right-0 z-30 h-[2px] bg-white/5">
                <div
                    key={currentSlide}
                    className="h-full bg-primary animate-hero-progress"
                />
            </div>

            {/* Slides Container */}
            <div className="absolute inset-0">
                {slides.map((slide, index) => (
                    <div
                        key={index}
                        className={cn(
                            "absolute inset-0 transition-opacity duration-1500 ease-in-out",
                            index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
                        )}
                    >
                        <Image
                            src={slide.image}
                            alt={slide.title}
                            fill
                            className={cn(
                                "object-cover opacity-60 transition-transform duration-[7000ms] ease-out",
                                index === currentSlide ? "scale-110" : "scale-100"
                            )}
                            priority={index === 0}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-ebony via-transparent to-ebony/20 opacity-95" />

                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                            <div className={cn(
                                "mb-12 flex items-center justify-center gap-6 transition-all duration-1000 delay-300",
                                index === currentSlide ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                            )}>
                                <div className="h-[1px] w-16 bg-primary/60"></div>
                                <span className="text-primary text-[11px] font-bold uppercase tracking-[0.6em]">{slide.label}</span>
                                <div className="h-[1px] w-16 bg-primary/60"></div>
                            </div>

                            <h1 className={cn(
                                "text-white text-6xl md:text-9xl font-serif mb-12 max-w-6xl leading-[0.9] tracking-tight transition-all duration-1200 delay-500",
                                index === currentSlide ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
                            )}>
                                {slide.title.split(' ').map((word, i) => (
                                    word.toLowerCase().includes('artistry') || word.toLowerCase().includes('soul') || word.toLowerCase().includes('vision') ? (
                                        <span key={i} className="italic text-primary block sm:inline">{word} </span>
                                    ) : (
                                        <span key={i}>{word} </span>
                                    )
                                ))}
                            </h1>

                            <p className={cn(
                                "text-white/50 text-xl md:text-2xl max-w-3xl font-light mb-20 italic transition-all duration-1200 delay-700 leading-relaxed",
                                index === currentSlide ? "opacity-100 translate-y-0" : "opacity-0 translate-y-16"
                            )}>
                                &ldquo;{slide.description}&rdquo;
                            </p>

                            <div className={cn(
                                "flex flex-col sm:flex-row gap-10 transition-all duration-1200 delay-1000",
                                index === currentSlide ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"
                            )}>
                                <Button size="lg" className="apple-button h-22 px-20 text-[12px] bg-primary hover:bg-primary/90 text-white border-none">
                                    Enter the Gallery
                                </Button>
                                <Button size="lg" variant="outline" className="h-22 px-20 text-[12px] border-white/20 text-white hover:bg-white/10 rounded-none uppercase tracking-[0.4em] font-bold transition-all duration-700">
                                    The Heritage
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Navigation Indicators - Minimalist Architectural Strip */}
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-0">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => {
                            if (isAnimating) return
                            setCurrentSlide(index)
                        }}
                        className="group relative px-4 py-8"
                    >
                        <div className={cn(
                            "h-1 transition-all duration-700 bg-white/10 group-hover:bg-white/30",
                            index === currentSlide ? "w-20 bg-primary" : "w-10"
                        )} />
                        <span className={cn(
                            "absolute top-12 left-1/2 -translate-x-1/2 text-[9px] font-bold tracking-widest text-white/20 transition-all duration-500",
                            index === currentSlide ? "opacity-100 text-primary" : "opacity-0"
                        )}>
                            0{index + 1}
                        </span>
                    </button>
                ))}
            </div>
        </section>
    )
}
