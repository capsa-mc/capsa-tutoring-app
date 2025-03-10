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

  try {
    // Attempt to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    })

    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        // Try to resend verification email
        const { error: resendError } = await supabase.auth.resend({
          type: 'signup',
          email: body.email,
          options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/callback?registration=true`,
          },
        })

        if (!resendError) {
          return NextResponse.json(
            { error: 'Email not confirmed. A new verification email has been sent. Please check your inbox.' },
            { status: 400 }
          )
        }
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
} 