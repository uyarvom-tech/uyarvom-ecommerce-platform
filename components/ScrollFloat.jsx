'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const ScrollFloat = ({
  children,
  animationDuration = 1,
  ease = 'back.inOut(2)',
  scrollStart = 'center bottom+=50%',
  scrollEnd = 'bottom bottom-=40%',
  stagger = 0.03,
  className = ''
}) => {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Split text into individual characters
    const text = container.textContent
    container.innerHTML = ''
    
    text.split('').forEach((char, index) => {
      const span = document.createElement('span')
      span.textContent = char === ' ' ? '\u00A0' : char // Use non-breaking space
      span.style.display = 'inline-block'
      span.style.opacity = '0'
      span.style.transform = 'translateY(50px)'
      container.appendChild(span)
    })

    const chars = container.querySelectorAll('span')

    // Animate characters
    gsap.fromTo(
      chars,
      {
        opacity: 0,
        y: 50,
      },
      {
        opacity: 1,
        y: 0,
        duration: animationDuration,
        ease: ease,
        stagger: stagger,
        scrollTrigger: {
          trigger: container,
          start: scrollStart,
          end: scrollEnd,
          toggleActions: 'play none none reverse',
        },
      }
    )

    return () => {
      ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.trigger === container) {
          trigger.kill()
        }
      })
    }
  }, [animationDuration, ease, scrollStart, scrollEnd, stagger])

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  )
}

export default ScrollFloat