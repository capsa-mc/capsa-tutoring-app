import { ReactNode } from 'react'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'

export default function ApplicationsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 pt-16">
        {children}
      </main>
      <Footer />
    </>
  )
} 