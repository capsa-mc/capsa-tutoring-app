import Image from 'next/image'
import Link from 'next/link'
import { theme } from '../styles/theme'
import ScrollLink from './ScrollLink'

type NavItem = {
  label: string
  href?: string
  targetId?: string
  isSection: boolean
  variant?: 'default' | 'primary' | 'secondary'
}

export default function Header() {
  /**
   * Navigation items configuration
   * Current status:
   * - Home ('/'): Implemented - Main landing page
   * - About: Implemented as a section on the home page (scroll target)
   * - Register ('/register'): Implemented - Registration page
   * - Login ('/login'): Implemented - Login page
   */
  const navItems: NavItem[] = [
    { label: 'Home', href: '/', isSection: false },
    { label: 'About', targetId: 'about', isSection: true },
    { label: 'Login', href: '/login', isSection: false, variant: 'secondary' },
    { label: 'Register', href: '/register', isSection: false, variant: 'primary' },
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
          <div className={theme.header.nav.menu.desktop}>
            {navItems.map((item) => (
              item.isSection && item.targetId ? (
                <ScrollLink
                  key={item.targetId}
                  targetId={item.targetId}
                  className={getButtonStyles()}
                >
                  {item.label}
                </ScrollLink>
              ) : (
                <Link
                  key={item.href}
                  href={item.href || '/'}
                  className={getButtonStyles(item.variant)}
                >
                  {item.label}
                </Link>
              )
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button className={theme.header.nav.menu.mobile}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </nav>
      </div>
    </header>
  )
} 