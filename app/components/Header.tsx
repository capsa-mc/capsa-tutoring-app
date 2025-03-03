import Image from 'next/image'
import Link from 'next/link'
import { theme } from '../styles/theme'
import ScrollLink from './ScrollLink'

export default function Header() {
  /**
   * Navigation items configuration
   * Current status:
   * - Home ('/'): Implemented - Main landing page
   * - About: Implemented as a section on the home page (scroll target)
   * - Register ('/register'): Not implemented yet
   */
  const navItems = [
    { label: 'Home', href: '/', isSection: false },
    { label: 'About', targetId: 'about', isSection: true },
    { label: 'Register', href: '/register', isSection: false },
  ]

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
              item.isSection ? (
                <ScrollLink
                  key={item.targetId}
                  targetId={item.targetId}
                  className={`${theme.header.nav.menu.link.base} ${theme.text.body.base} ${theme.header.nav.menu.link.hover}`}
                >
                  {item.label}
                </ScrollLink>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    item.label === 'Register' 
                      ? `${theme.button.primary.base} ${theme.button.primary.default}`
                      : `${theme.header.nav.menu.link.base} ${theme.text.body.base} ${theme.header.nav.menu.link.hover}`
                  }
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