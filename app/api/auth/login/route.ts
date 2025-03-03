import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { CookieOptions } from '@supabase/ssr'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const response = new NextResponse()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete({ name, ...options })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  try {
    const body = await request.json()

    const { data: { session }, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { 
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }

    return NextResponse.json({ 
      data: { 
        user: session?.user,
        session: session
      } 
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ 
      error: 'An unexpected error occurred' 
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
} 