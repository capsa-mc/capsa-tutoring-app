import React from 'react'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import { theme } from '@/app/styles/theme'

interface ProfileLayoutProps {
  children: React.ReactNode
}

const ProfileLayout: React.FC<ProfileLayoutProps> = ({ children }) => {
  return (
    <>
      <Header />
      <main className={`min-h-[calc(100vh-4rem-5rem)] py-8 ${theme.colors.background.gradient}`}>
        {children}
      </main>
      <Footer />
    </>
  )
}

export default ProfileLayout 