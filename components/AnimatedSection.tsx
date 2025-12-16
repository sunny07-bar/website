'use client'

import { ReactNode, useEffect, useRef, useState } from 'react'

interface AnimatedSectionProps {
  children: ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale'
}

export default function AnimatedSection({
  children,
  className = '',
  delay = 0,
  direction = 'up',
}: AnimatedSectionProps) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true)
          }, delay)
          // Unobserve after animation starts for better performance
          observer.unobserve(element)
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [delay])

  const getAnimationClass = () => {
    if (!isVisible) {
      return 'opacity-0'
    }
    return 'opacity-100'
  }

  return (
    <div
      ref={ref}
      className={`transition-opacity duration-300 ease-out ${getAnimationClass()} ${className}`}
    >
      {children}
    </div>
  )
}

