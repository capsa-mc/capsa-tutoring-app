'use client'

import { ReactNode } from 'react'

interface ScrollLinkProps {
  targetId: string
  className?: string
  children: ReactNode
}

export default function ScrollLink({ targetId, className, children }: ScrollLinkProps) {
  const handleClick = () => {
    const element = document.getElementById(targetId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  )
} 