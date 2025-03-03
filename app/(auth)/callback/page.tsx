'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { theme } from '@/app/styles/theme'
import { supabase } from '@/lib/supabase'

export default function CallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isEmailVerification = searchParams.has('token_hash')

  useEffect(() => {
    const handleEmailVerification = async () => {
      if (isEmailVerification) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.id && user?.email) {
          // Update profile to mark email as verified and set student_email
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ 
              email_verified: true,
              student_email: user.email 
            })
            .eq('id', user.id)

          if (profileError) {
            console.error('Error updating profile:', profileError)
          }
        }
      }
    }

    handleEmailVerification()

    const timer = setTimeout(() => {
      router.push('/')
    }, 5000)

    return () => clearTimeout(timer)
  }, [router, isEmailVerification])

  return (
    <section className={theme.layout.section.default}>
      <div className={theme.layout.container}>
        <div className={`${theme.layout.maxWidth.sm} mx-auto`}>
          <div className={theme.layout.auth.card}>
            <h1 className={`${theme.text.heading.h2} ${theme.spacing.section}`}>
              {isEmailVerification ? 'Email Verified!' : 'Authentication Complete'}
            </h1>
            
            <p className={`${theme.text.body.base} ${theme.spacing.element}`}>
              {isEmailVerification
                ? 'Your email has been successfully verified. You can now sign in to your account.'
                : 'You have been successfully authenticated.'}
            </p>
            
            <p className={theme.text.body.small}>
              You will be redirected to the home page in a few seconds...
            </p>
          </div>
        </div>
      </div>
    </section>
  )
} 