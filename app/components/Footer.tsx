'use client'

import Link from 'next/link'
import { theme } from '../styles/theme'
import ScrollLink from './ScrollLink'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className={theme.footer.wrapper}>
      <div className={`${theme.layout.container} ${theme.footer.spacing}`}>
        <div className={theme.layout.grid.footer}>
          <div className={theme.text.align.left}>
            <p className={theme.footer.text.primary}>
              Chinese American Parents and Students Association, Montgomery County
            </p>
            <p className={`${theme.footer.text.primary} mt-2`}>
              Supporting K12 education since 1988
            </p>
            <p className={`${theme.footer.text.primary} mt-2`}>
              Built by Zhendong Chen and AI.
            </p>
          </div>
          <nav className={theme.footer.nav.wrapper}>
            <Link href="/" className={theme.footer.text.primary}>Home</Link>
            <ScrollLink targetId="about" className={theme.footer.text.primary}>
              About
            </ScrollLink>
            <ScrollLink targetId="program" className={theme.footer.text.primary}>
              Program
            </ScrollLink>
            <Link href="/register" className={theme.footer.text.primary}>Register</Link>
          </nav>
        </div>

        <div className={`${theme.footer.border} mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-4`}>
          <p className={theme.footer.text.secondary}>© {currentYear} CAPSA-MC. All rights reserved.</p>
          <div className={theme.footer.nav.links}>
          </div>
        </div>
      </div>
    </footer>
  )
} 