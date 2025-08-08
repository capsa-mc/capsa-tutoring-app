import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Role } from '@/types/database/schema'

export const createServerSupabaseClient = async () => {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete({ name, ...options })
        },
      },
    }
  )
}

export const verifyUserAccess = async (allowedRoles: Role[] = [Role.Admin, Role.Staff, Role.Coordinator]) => {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return {
      success: false as const,
      error: 'Unauthorized',
      status: 401
    }
  }
  
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (profileError || !profile) {
    return {
      success: false as const,
      error: 'Profile not found',
      status: 404
    }
  }
  
  if (!allowedRoles.includes(profile.role as Role)) {
    return {
      success: false as const,
      error: 'Insufficient permissions',
      status: 403
    }
  }
  
  return {
    success: true as const,
    user,
    profile,
    supabase
  }
}

export const createErrorResponse = (message: string, status: number = 500) => {
  return Response.json({ error: message }, { status })
}