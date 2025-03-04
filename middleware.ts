import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Create a response with the original request headers
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create a Supabase client with cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Set cookie in both request and response
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          // Remove cookie from both request and response
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Check auth condition for protected routes
  if (request.nextUrl.pathname.startsWith('/profile') || request.nextUrl.pathname.startsWith('/applications')) {
    try {
      // Use getUser instead of getSession for better security
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        // Auth condition not met, redirect to login page
        const redirectUrl = new URL('/login', request.url)
        redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
        return NextResponse.redirect(redirectUrl)
      }

      // For applications route, check if user has appropriate role
      if (request.nextUrl.pathname.startsWith('/applications')) {
        try {
          // Get user profile to check role
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

          if (profileError) {
            console.error('Profile error:', profileError)
            return NextResponse.redirect(new URL('/', request.url))
          }

          // Allow Admin, Staff, and Coordinator roles to access applications route
          if (!profile || (profile.role !== 'Admin' && profile.role !== 'Staff' && profile.role !== 'Coordinator')) {
            // User doesn't have appropriate role, redirect to home
            return NextResponse.redirect(new URL('/', request.url))
          }
        } catch (profileError) {
          console.error('Error checking profile:', profileError)
          return NextResponse.redirect(new URL('/', request.url))
        }
      }
    } catch (error) {
      console.error('Auth error:', error)
      // Auth error, redirect to login page
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Return response with updated cookies
  return response
}

export const config = {
  matcher: ['/profile/:path*', '/applications/:path*']
} 