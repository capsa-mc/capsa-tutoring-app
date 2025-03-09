import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { CookieOptions } from '@supabase/ssr'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = cookieStore.get(name)
          return cookie?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            console.error('Error setting cookie:', error)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.delete({ name, ...options })
          } catch (error) {
            console.error('Error removing cookie:', error)
          }
        },
      },
    }
  )

  const body = await request.json()
  const { email } = body

  try {
    // Try to sign in with a dummy password to check user status
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: 'dummy_password_that_will_fail'
    })

    // If the error message indicates invalid credentials, it means the user exists
    if (signInError?.message?.includes('Invalid login credentials')) {
      // Try to resend verification email
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/callback?registration=true`,
        },
      })

      if (resendError) {
        if (resendError.message.includes('Email already confirmed')) {
          return NextResponse.json({ error: 'Email already confirmed' }, { status: 400 })
        }
        return NextResponse.json({ error: resendError.message }, { status: 400 })
      }

      return NextResponse.json({ message: 'Verification email sent successfully' })
    }

    // If we get here, the user doesn't exist
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  } catch (error) {
    console.error('Error resending verification:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
} 