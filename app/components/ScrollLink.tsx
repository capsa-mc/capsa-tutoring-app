'use client'

import { ReactNode } from 'react'

interface ScrollLinkProps {
  targetId: string
  className?: string
  children: ReactNode
  onClick?: () => void
}

export default function ScrollLink({ targetId, className, children, onClick }: ScrollLinkProps) {
  const handleClick = () => {
    const element = document.getElementById(targetId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    // Call the onClick handler if provided
    if (onClick) {
      onClick()
    }
  }

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  )
} 