'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { theme } from '../styles/theme'
import ScrollLink from './ScrollLink'
import { Role } from '@/types/database/schema'
import { createClient, getCurrentUser, getUserProfile } from '@/lib/supabase'

type NavItem = {
  label: string
  href?: string
  targetId?: string
  isSection: boolean
  variant?: 'default' | 'primary' | 'secondary'
  protected?: boolean
  adminOnly?: boolean
}

export default function Header() {
  const pathname = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState<Role | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true;
    let subscription: { unsubscribe: () => void } | null = null;

    const checkSession = async () => {
      if (!isMounted) return;
      
      setIsLoading(true)
      try {
        // Use the safer getUser method
        const user = await getCurrentUser()
        
        if (!user) {
          setIsLoggedIn(false)
          setUserRole(null)
          setIsLoading(false)
          return
        }
        
        setIsLoggedIn(true)
        
        // Get user profile
        const profile = await getUserProfile(user.id)
        
        if (profile) {
          setUserRole(profile.role as Role)
        }
      } catch (error) {
        console.error('Error checking session:', error)
        setIsLoggedIn(false)
        setUserRole(null)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    // Initialize Supabase client safely
    const initializeAuth = async () => {
      try {
        const supabase = createClient()
        
        // Set up auth state change listener with error handling
        try {
          const { data } = supabase.auth.onAuthStateChange(async (event) => {
            if (!isMounted) return;
            
            if (event === 'SIGNED_IN') {
              checkSession()
            } else if (event === 'SIGNED_OUT') {
              setIsLoggedIn(false)
              setUserRole(null)
            }
          })
          
          subscription = data.subscription;
        } catch (error) {
          console.error('Error setting up auth state change listener:', error)
        }
        
        // Initial session check
        await checkSession()
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (isMounted) {
          setIsLoading(false)
          setIsLoggedIn(false)
        }
      }
    }

    initializeAuth()

    return () => {
      isMounted = false;
      if (subscription) {
        try {
          subscription.unsubscribe()
        } catch (error) {
          console.error('Error unsubscribing from auth state change:', error)
        }
      }
    }
  }, [])

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      // Use window.location for a full page reload
      window.location.href = '/'
    } catch (error) {
      console.error('Error signing out:', error)
    }
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
    { label: 'Applications', href: '/applications', isSection: false, variant: 'secondary', protected: true, adminOnly: true },
    { label: 'Pairs', href: '/pairs', isSection: false, variant: 'secondary', protected: true, adminOnly: true },
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

  const isProtectedRoute = pathname?.startsWith('/profile') || 
                          pathname?.startsWith('/sessions') || 
                          pathname?.startsWith('/admin') || 
                          pathname?.startsWith('/applications') ||
                          pathname?.startsWith('/pairs')

  // Filter out admin-only items if user is not an admin
  const filteredProtectedNavItems = protectedNavItems.filter(item => 
    !item.adminOnly || (item.adminOnly && (userRole === Role.Admin || userRole === Role.Staff || userRole === Role.Coordinator))
  )

  const navItems = [...publicNavItems, ...(isLoggedIn || isProtectedRoute ? filteredProtectedNavItems : authNavItems)]

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
            {isLoading ? (
              <div className="animate-pulse h-8 w-32 bg-gray-200 rounded"></div>
            ) : (
              navItems.map((item) => (
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
              ))
            )}
          </div>
        </nav>
      </div>
    </header>
  )
} 