'use client'

import { theme } from '@/app/styles/theme'
import Header from '../Header'
import Footer from '../Footer'

interface PageLayoutProps {
  children: React.ReactNode
  className?: string
}

export default function PageLayout({ children, className }: PageLayoutProps) {
  return (
    <>
      <Header />
      <main className={`min-h-[calc(100vh-4rem-5rem)] py-8 ${theme.colors.background.gradient} ${className || ''}`}>
        {children}
      </main>
      <Footer />
    </>
  )
} 