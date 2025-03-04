'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { usePathname, useRouter } from 'next/navigation'
import { theme } from '../styles/theme'
import ScrollLink from './ScrollLink'

type NavItem = {
  label: string
  href?: string
  targetId?: string
  isSection: boolean
  variant?: 'default' | 'primary' | 'secondary'
  protected?: boolean
}

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsLoggedIn(!!session)
    }

    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      setIsLoggedIn(event === 'SIGNED_IN')
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    await supabase.auth.signOut()
    router.push('/')
  }

  const publicNavItems: NavItem[] = [
    { label: 'Home', href: '/', isSection: false },
    { label: 'About', targetId: 'about', isSection: true },
  ]

  const authNavItems: NavItem[] = [
    { label: 'Login', href: '/login', isSection: false, variant: 'secondary', protected: false },
    { label: 'Register', href: '/register', isSection: false, variant: 'primary', protected: false },
  ]

  const protectedNavItems: NavItem[] = [
    { label: 'Profile', href: '/profile', isSection: false, variant: 'secondary', protected: true },
    { label: 'Logout', href: '#', isSection: false, variant: 'primary', protected: true },
  ]

  const getButtonStyles = (variant?: string) => {
    switch (variant) {
      case 'primary':
        return `${theme.button.primary.base} ${theme.button.primary.default}`
      case 'secondary':
        return `px-6 py-2 rounded-lg font-medium transition-colors border border-sky-500 text-sky-500 hover:bg-sky-50 ml-2`
      default:
        return `${theme.header.nav.menu.link.base} ${theme.text.body.base} ${theme.header.nav.menu.link.hover}`
    }
  }

  const isProtectedRoute = pathname?.startsWith('/profile') || pathname?.startsWith('/sessions')

  const navItems = [...publicNavItems, ...(isLoggedIn || isProtectedRoute ? protectedNavItems : authNavItems)]

  return (
    <header className={theme.header.wrapper}>
      <div className={theme.layout.container}>
        <nav className={theme.header.nav.wrapper}>
          <div className={theme.header.nav.logo.wrapper}>
            <Link href="/">
              <Image
                src="/images/logo.svg"
                alt="CAPSA-MC Logo"
                width={80}
                height={24}
                className={theme.header.nav.logo.image}
                priority
              />
            </Link>
            <div className={theme.header.nav.logo.text}>
              CAPSA-MC
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <div className={theme.header.nav.menu.wrapper}>
            {navItems.map((item) => (
              item.isSection && item.targetId ? (
                <ScrollLink
                  key={item.targetId}
                  targetId={item.targetId}
                  className={getButtonStyles()}
                >
                  {item.label}
                </ScrollLink>
              ) : item.label === 'Logout' ? (
                <button
                  key={item.label}
                  onClick={handleLogout}
                  className={getButtonStyles(item.variant)}
                >
                  {item.label}
                </button>
              ) : (
                <Link
                  key={item.label}
                  href={item.href || '#'}
                  className={getButtonStyles(item.variant)}
                >
                  {item.label}
                </Link>
              )
            ))}
          </div>
        </nav>
      </div>
    </header>
  )
} 