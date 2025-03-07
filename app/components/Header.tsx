'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState, useRef, useMemo } from 'react'
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
  children?: NavItem[]
}

export default function Header() {
  const pathname = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState<Role | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false)
  const [isMobileAdminMenuOpen, setIsMobileAdminMenuOpen] = useState(false)
  const adminMenuRef = useRef<HTMLDivElement>(null)

  // Define adminSubItems using useMemo to avoid recreating the array on every render
  const adminSubItems: NavItem[] = useMemo(() => [
    { label: 'Applications', href: '/applications', isSection: false, variant: 'default' as const, protected: true, adminOnly: true },
    { label: 'Pairs', href: '/pairs', isSection: false, variant: 'default' as const, protected: true, adminOnly: true },
    { label: 'Sessions', href: '/sessions', isSection: false, variant: 'default' as const, protected: true, adminOnly: true },
    { label: 'Attendances', href: '/attendances', isSection: false, variant: 'default' as const, protected: true, adminOnly: true },
  ], []);

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

  // Close mobile menu when changing routes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    
    // Only close admin menu if we're not navigating to an admin submenu page
    const isAdminSubPage = adminSubItems.some(item => item.href === pathname);
    if (!isAdminSubPage) {
      setIsAdminMenuOpen(false);
      setIsMobileAdminMenuOpen(false);
    }
  }, [pathname, adminSubItems]);

  // Close admin menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (adminMenuRef.current && !adminMenuRef.current.contains(event.target as Node)) {
        setIsAdminMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
    { 
      label: 'Admin', 
      href: '#', 
      isSection: false, 
      variant: 'secondary', 
      protected: true, 
      adminOnly: true,
      children: adminSubItems
    },
    { label: 'Profile', href: '/profile', isSection: false, variant: 'secondary', protected: true },
    { label: 'Logout', href: '#', isSection: false, variant: 'primary', protected: true },
  ]

  const getButtonStyles = (variant?: string, isMobile: boolean = false) => {
    switch (variant) {
      case 'primary':
        return isMobile 
          ? `w-full text-center py-3 rounded-lg font-medium transition-colors bg-sky-500 text-white hover:bg-sky-600 mb-2`
          : `${theme.button.primary.base} ${theme.button.primary.default}`
      case 'secondary':
        return isMobile
          ? `w-full text-center py-3 rounded-lg font-medium transition-colors border border-sky-500 text-sky-500 hover:bg-sky-50 mb-2`
          : `px-6 py-2 rounded-lg font-medium transition-colors border border-sky-500 text-sky-500 hover:bg-sky-50 ml-2`
      default:
        return isMobile
          ? `w-full text-center py-3 text-gray-800 hover:bg-gray-100 rounded-lg mb-2`
          : `${theme.header.nav.menu.link.base} ${theme.text.body.base} ${theme.header.nav.menu.link.hover}`
    }
  }

  const isProtectedRoute = pathname?.startsWith('/profile') || 
                          pathname?.startsWith('/sessions') || 
                          pathname?.startsWith('/admin') || 
                          pathname?.startsWith('/applications') ||
                          pathname?.startsWith('/pairs') ||
                          pathname?.startsWith('/attendances')

  // Filter out admin-only items if user is not an admin
  const filteredProtectedNavItems = protectedNavItems.filter(item => 
    !item.adminOnly || (item.adminOnly && (userRole === Role.Admin || userRole === Role.Staff || userRole === Role.Coordinator))
  )

  const navItems = [...publicNavItems, ...(isLoggedIn || isProtectedRoute ? filteredProtectedNavItems : authNavItems)]

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleAdminMenu = () => {
    setIsAdminMenuOpen(!isAdminMenuOpen);
  };

  const toggleMobileAdminMenu = (e: React.MouseEvent) => {
    // Prevent event propagation to avoid closing the mobile menu
    e.stopPropagation();
    setIsMobileAdminMenuOpen(!isMobileAdminMenuOpen);
  };

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
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              onClick={toggleMobileMenu}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
          
          {/* Desktop Navigation */}
          <div className={theme.header.nav.menu.wrapper}>
            {isLoading ? (
              <div className="animate-pulse h-8 w-32 bg-gray-200 rounded"></div>
            ) : (
              navItems.map((item) => {
                if (item.label === 'Admin' && item.children) {
                  return (
                    <div key={item.label} className="relative" ref={adminMenuRef}>
                      <button
                        onClick={toggleAdminMenu}
                        className={`${getButtonStyles(item.variant)} flex items-center group relative`}
                        aria-expanded={isAdminMenuOpen}
                      >
                        <span className="flex items-center">
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-5 w-5 mr-1 text-sky-500" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {item.label}
                        </span>
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className={`ml-1 h-4 w-4 transition-transform text-sky-500 ${isAdminMenuOpen ? 'rotate-180' : ''}`} 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {isAdminMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-100 overflow-hidden animate-fadeIn">
                          {item.children.map((subItem, index) => (
                            <Link
                              key={subItem.label}
                              href={subItem.href || '#'}
                              className={`block px-4 py-3 text-sm text-gray-700 hover:bg-sky-50 hover:text-sky-600 transition-colors border-l-2 border-transparent hover:border-sky-500 ${
                                pathname === subItem.href ? 'bg-sky-50 text-sky-600 border-l-2 border-sky-500 font-medium' : ''
                              } animate-slideIn`}
                              style={{ animationDelay: `${index * 50}ms` }}
                            >
                              {subItem.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
                
                return item.isSection && item.targetId ? (
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
                );
              })
            )}
          </div>
        </nav>
        
        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div 
            className="md:hidden py-4 px-2 bg-white border-t border-gray-100 z-50"
            onClick={(e) => e.stopPropagation()}
          >
            {isLoading ? (
              <div className="animate-pulse h-40 bg-gray-200 rounded"></div>
            ) : (
              <div className="flex flex-col space-y-1">
                {navItems.map((item) => {
                  if (item.label === 'Admin' && item.children) {
                    return (
                      <div key={item.label} className="mb-2">
                        <button
                          onClick={toggleMobileAdminMenu}
                          className={`${getButtonStyles(item.variant, true)} flex items-center justify-between`}
                        >
                          <span className="flex items-center">
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              className="h-5 w-5 mr-2 text-sky-500" 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {item.label}
                          </span>
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className={`ml-1 h-4 w-4 transition-transform text-sky-500 ${isMobileAdminMenuOpen ? 'rotate-180' : ''}`} 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        
                        {isMobileAdminMenuOpen && (
                          <div 
                            className="mt-2 mb-3 border border-gray-100 rounded-md overflow-hidden bg-gray-50 animate-fadeIn"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {item.children.map((subItem, index) => (
                              <Link
                                key={subItem.label}
                                href={subItem.href || '#'}
                                className={`block py-3 px-4 text-sm hover:bg-sky-50 hover:text-sky-600 transition-colors border-l-2 border-transparent hover:border-sky-500 ${
                                  pathname === subItem.href ? 'bg-sky-50 text-sky-600 border-l-2 border-sky-500 font-medium' : 'text-gray-700'
                                } animate-slideIn`}
                                style={{ animationDelay: `${index * 50}ms` }}
                                onClick={(e) => {
                                  // Prevent the mobile menu from closing when clicking on Admin submenu items
                                  e.stopPropagation();
                                  // Keep the mobile menu open but close the admin submenu
                                  setIsMobileAdminMenuOpen(false);
                                }}
                              >
                                {subItem.label}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }
                  
                  return item.isSection && item.targetId ? (
                    <ScrollLink
                      key={item.targetId}
                      targetId={item.targetId}
                      className={getButtonStyles(undefined, true)}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.label}
                    </ScrollLink>
                  ) : item.label === 'Logout' ? (
                    <button
                      key={item.label}
                      onClick={handleLogout}
                      className={getButtonStyles(item.variant, true)}
                    >
                      {item.label}
                    </button>
                  ) : (
                    <Link
                      key={item.label}
                      href={item.href || '#'}
                      className={getButtonStyles(item.variant, true)}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
} 