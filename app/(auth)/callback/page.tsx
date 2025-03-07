'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { theme } from '@/app/styles/theme'
import { supabase } from '@/lib/supabase'

export default function CallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isEmailVerification = searchParams.has('token_hash')
  const code = searchParams.get('code')
  const isRegistration = searchParams.has('registration')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  
  const [processingStatus, setProcessingStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    // If URL already contains error parameters, set error state immediately
    if (error || errorDescription) {
      setProcessingStatus('error')
      setErrorMessage(errorDescription || 'Authentication failed. Please try again.')
      return
    }

    const handleCallback = async () => {
      try {
        // Handle email verification
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
              setProcessingStatus('error')
              setErrorMessage('Email verification succeeded, but there was an error updating your profile.')
              return
            }
          }
        }
        
        // Handle code exchange (OAuth or magic link)
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            console.error('Error exchanging code for session:', error)
            setProcessingStatus('error')
            setErrorMessage('Failed to authenticate. The link may have expired or is invalid.')
            return
          } else if (data.session) {
            console.log('Session established successfully')
          }
        }
        
        // If we got here without errors, set success
        setProcessingStatus('success')
      } catch (error) {
        console.error('Error in callback handling:', error)
        setProcessingStatus('error')
        setErrorMessage('An unexpected error occurred during authentication.')
      }
    }

    handleCallback()

    // Only set up redirect timer if we're successful
    if (processingStatus === 'success') {
      const timer = setTimeout(() => {
        // Redirect to profile page if it's a registration, otherwise to login
        router.push(isRegistration ? '/profile' : '/login')
      }, 5000)
  
      return () => clearTimeout(timer)
    }
  }, [router, isEmailVerification, code, isRegistration, error, errorDescription, processingStatus])

  // Handle manual redirect
  const handleRedirect = () => {
    router.push(processingStatus === 'success' && isRegistration ? '/profile' : '/login')
  }

  return (
    <section className={theme.layout.section.default}>
      <div className={theme.layout.container}>
        <div className={`${theme.layout.maxWidth.sm} mx-auto`}>
          <div className={theme.layout.auth.card}>
            {processingStatus === 'processing' && (
              <>
                <div className="flex justify-center mb-6">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
                </div>
                <h1 className={`${theme.text.heading.h2} ${theme.spacing.section} text-center`}>
                  Processing...
                </h1>
                <p className={`${theme.text.body.base} ${theme.spacing.element} text-center`}>
                  Please wait while we verify your authentication.
                </p>
              </>
            )}
            
            {processingStatus === 'error' && (
              <>
                <div className="flex justify-center mb-6">
                  <div className="rounded-full bg-red-100 p-3">
                    <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <h1 className={`${theme.text.heading.h2} ${theme.spacing.section} text-center`}>
                  Authentication Failed
                </h1>
                <p className={`${theme.text.body.base} ${theme.spacing.element} text-center`}>
                  {errorMessage || 'There was a problem with your authentication.'}
                </p>
                <div className="flex justify-center mt-6">
                  <button 
                    onClick={handleRedirect}
                    className="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600"
                  >
                    Return to Login
                  </button>
                </div>
              </>
            )}
            
            {processingStatus === 'success' && isRegistration ? (
              <>
                <div className="flex justify-center mb-6">
                  <div className="rounded-full bg-green-100 p-3">
                    <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <h1 className={`${theme.text.heading.h2} ${theme.spacing.section} text-center`}>
                  Registration Successful!
                </h1>
                <p className={`${theme.text.body.base} ${theme.spacing.element} text-center`}>
                  Your account has been created successfully. You are now signed in.
                </p>
                <p className={`${theme.text.body.small} text-center`}>
                  You will be redirected to your profile page in a few seconds...
                </p>
                <div className="flex justify-center mt-6">
                  <button 
                    onClick={handleRedirect}
                    className="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600"
                  >
                    Go to Profile
                  </button>
                </div>
              </>
            ) : processingStatus === 'success' && isEmailVerification ? (
              <>
                <div className="flex justify-center mb-6">
                  <div className="rounded-full bg-blue-100 p-3">
                    <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <h1 className={`${theme.text.heading.h2} ${theme.spacing.section} text-center`}>
                  Email Verified!
                </h1>
                <p className={`${theme.text.body.base} ${theme.spacing.element} text-center`}>
                  Your email has been successfully verified. You can now sign in to your account.
                </p>
                <p className={`${theme.text.body.small} text-center`}>
                  You will be redirected to the login page in a few seconds...
                </p>
                <div className="flex justify-center mt-6">
                  <button 
                    onClick={handleRedirect}
                    className="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600"
                  >
                    Go to Login
                  </button>
                </div>
              </>
            ) : processingStatus === 'success' && (
              <>
                <div className="flex justify-center mb-6">
                  <div className="rounded-full bg-sky-100 p-3">
                    <svg className="h-8 w-8 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <h1 className={`${theme.text.heading.h2} ${theme.spacing.section} text-center`}>
                  Authentication Complete
                </h1>
                <p className={`${theme.text.body.base} ${theme.spacing.element} text-center`}>
                  You have been successfully authenticated.
                </p>
                <p className={`${theme.text.body.small} text-center`}>
                  You will be redirected to the login page in a few seconds...
                </p>
                <div className="flex justify-center mt-6">
                  <button 
                    onClick={handleRedirect}
                    className="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600"
                  >
                    Go to Login
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
} 