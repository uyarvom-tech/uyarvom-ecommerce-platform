'use client'

import { useState, useRef, ReactNode } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import Image from 'next/image'

interface TiltedCardProps {
  imageSrc: string
  altText: string
  captionText?: string
  containerHeight?: string
  containerWidth?: string
  imageHeight?: string
  imageWidth?: string
  rotateAmplitude?: number
  scaleOnHover?: number
  showMobileWarning?: boolean
  showTooltip?: boolean
  displayOverlayContent?: boolean
  overlayContent?: ReactNode
  onClick?: () => void
  className?: string
}

export default function TiltedCard({
  imageSrc,
  altText,
  captionText,
  containerHeight = "300px",
  containerWidth = "300px",
  imageHeight = "300px",
  imageWidth = "300px",
  rotateAmplitude = 12,
  scaleOnHover = 1.05,
  showMobileWarning = false,
  showTooltip = true,
  displayOverlayContent = true,
  overlayContent,
  onClick,
  className = ""
}: TiltedCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Motion values for mouse position
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // Spring animations for smooth movement
  const mouseXSpring = useSpring(x, { stiffness: 500, damping: 100 })
  const mouseYSpring = useSpring(y, { stiffness: 500, damping: 100 })

  // Transform mouse position to rotation values
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [rotateAmplitude, -rotateAmplitude])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-rotateAmplitude, rotateAmplitude])

  // Handle mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return

    const rect = ref.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    
    const xPct = mouseX / width - 0.5
    const yPct = mouseY / height - 0.5
    
    x.set(xPct)
    y.set(yPct)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    x.set(0)
    y.set(0)
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
  }

  return (
    <div className={`tilted-card-container ${className}`}>
      <motion.div
        ref={ref}
        className="tilted-card relative cursor-pointer"
        style={{
          height: containerHeight,
          width: containerWidth,
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        animate={{
          scale: isHovered ? scaleOnHover : 1,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
      >
        {/* Main Image */}
        <div 
          className="relative overflow-hidden rounded-2xl shadow-2xl"
          style={{
            height: imageHeight,
            width: imageWidth,
            transform: "translateZ(75px)",
          }}
        >
          <Image
            src={imageSrc}
            alt={altText}
            fill
            className="object-cover transition-transform duration-700"
            style={{
              transform: isHovered ? 'scale(1.1)' : 'scale(1)',
            }}
          />
          
          {/* Overlay Content */}
          {displayOverlayContent && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end justify-center p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {overlayContent || (
                <div className="text-white text-center">
                  <h3 className="text-lg font-bold mb-2">{captionText}</h3>
                </div>
              )}
            </motion.div>
          )}

          {/* Shine Effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            style={{
              transform: `translateX(${isHovered ? '100%' : '-100%'})`,
              transition: 'transform 0.6s ease-in-out',
            }}
          />
        </div>

        {/* Caption */}
        {captionText && !displayOverlayContent && (
          <motion.div
            className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-center"
            style={{
              transform: "translateZ(50px)",
            }}
            animate={{
              y: isHovered ? -10 : 0,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
          >
            <p className="text-sm font-medium text-foreground whitespace-nowrap">
              {captionText}
            </p>
          </motion.div>
        )}

        {/* Tooltip */}
        {showTooltip && isHovered && (
          <motion.div
            className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap z-50"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            {altText}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black/80" />
          </motion.div>
        )}
      </motion.div>

      {/* Mobile Warning */}
      {showMobileWarning && (
        <div className="md:hidden mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            💡 For the best experience, view this on a desktop with a mouse!
          </p>
        </div>
      )}

      <style jsx>{`
        .tilted-card-container {
          perspective: 1000px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .tilted-card {
          transform-style: preserve-3d;
        }
        
        .tilted-card-demo-text {
          color: white;
          font-weight: bold;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
          margin: 0;
        }
      `}</style>
    </div>
  )
}