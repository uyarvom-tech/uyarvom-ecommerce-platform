'use client'

import { useEffect, useRef, useState } from 'react'

interface GhostCursorProps {
  color?: string
  brightness?: number
  edgeIntensity?: number
  trailLength?: number
  inertia?: number
  grainIntensity?: number
  bloomStrength?: number
  bloomRadius?: number
  bloomThreshold?: number
  fadeDelayMs?: number
  fadeDurationMs?: number
}

export default function GhostCursor({
  color = '#c9871d',
  brightness = 1.2,
  edgeIntensity = 0.3,
  trailLength = 60,
  inertia = 0.15,
  grainIntensity = 0.03,
  bloomStrength = 0.3,
  bloomRadius = 1.5,
  bloomThreshold = 0.02,
  fadeDelayMs = 1000,
  fadeDurationMs = 1500,
}: GhostCursorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const mousePos = useRef({ x: 0, y: 0 })
  const currentPos = useRef({ x: 0, y: 0 })
  const trail = useRef<Array<{ x: number; y: number; opacity: number }>>([])
  const fadeTimeout = useRef<NodeJS.Timeout>()
  const animationFrame = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const updateCanvasSize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY }
      setIsVisible(true)

      // Reset fade timeout
      if (fadeTimeout.current) {
        clearTimeout(fadeTimeout.current)
      }
      fadeTimeout.current = setTimeout(() => {
        setIsVisible(false)
      }, fadeDelayMs)
    }

    const handleMouseLeave = () => {
      setIsVisible(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)

    const animate = () => {
      if (!ctx || !canvas) return

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (!isVisible && trail.current.length === 0) {
        animationFrame.current = requestAnimationFrame(animate)
        return
      }

      // Smooth cursor movement with inertia
      currentPos.current.x += (mousePos.current.x - currentPos.current.x) * inertia
      currentPos.current.y += (mousePos.current.y - currentPos.current.y) * inertia

      // Add to trail
      if (isVisible) {
        trail.current.push({
          x: currentPos.current.x,
          y: currentPos.current.y,
          opacity: 1,
        })

        if (trail.current.length > trailLength) {
          trail.current.shift()
        }
      }

      // Fade out trail
      trail.current = trail.current
        .map((point, index) => ({
          ...point,
          opacity: isVisible
            ? (index / trail.current.length) * 0.8
            : point.opacity * 0.95,
        }))
        .filter(point => point.opacity > 0.01)

      // Draw trail with glow effect
      trail.current.forEach((point, index) => {
        const size = 80 + (index / trail.current.length) * 120
        const opacity = point.opacity * brightness

        // Create radial gradient for glow
        const gradient = ctx.createRadialGradient(
          point.x,
          point.y,
          0,
          point.x,
          point.y,
          size
        )

        // Parse color and add alpha
        const r = parseInt(color.slice(1, 3), 16)
        const g = parseInt(color.slice(3, 5), 16)
        const b = parseInt(color.slice(5, 7), 16)

        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${opacity * 0.9})`)
        gradient.addColorStop(0.2, `rgba(${r}, ${g}, ${b}, ${opacity * 0.7})`)
        gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${opacity * 0.4})`)
        gradient.addColorStop(0.8, `rgba(${r}, ${g}, ${b}, ${opacity * 0.15})`)
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)

        ctx.globalCompositeOperation = 'lighter'
        ctx.fillStyle = gradient
        ctx.fillRect(point.x - size, point.y - size, size * 2, size * 2)

        // Add bloom effect
        if (bloomStrength > 0) {
          const bloomGradient = ctx.createRadialGradient(
            point.x,
            point.y,
            0,
            point.x,
            point.y,
            size * bloomRadius
          )
          bloomGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${opacity * bloomStrength * 1.5})`)
          bloomGradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, ${opacity * bloomStrength * 0.8})`)
          bloomGradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, ${opacity * bloomStrength * 0.3})`)
          bloomGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)
          ctx.fillStyle = bloomGradient
          ctx.fillRect(point.x - size * bloomRadius, point.y - size * bloomRadius, size * bloomRadius * 2, size * bloomRadius * 2)
        }
        ctx.globalCompositeOperation = 'source-over'
      })

      // Add grain effect
      if (grainIntensity > 0) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] > 0) {
            const noise = (Math.random() - 0.5) * grainIntensity * 255
            data[i] += noise
            data[i + 1] += noise
            data[i + 2] += noise
          }
        }
        ctx.putImageData(imageData, 0, 0)
      }

      animationFrame.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', updateCanvasSize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      if (fadeTimeout.current) {
        clearTimeout(fadeTimeout.current)
      }
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current)
      }
    }
  }, [
    color,
    brightness,
    edgeIntensity,
    trailLength,
    inertia,
    grainIntensity,
    bloomStrength,
    bloomRadius,
    bloomThreshold,
    fadeDelayMs,
    fadeDurationMs,
    isVisible,
  ])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50"
      style={{ mixBlendMode: 'lighten', opacity: 0.9 }}
    />
  )
}
