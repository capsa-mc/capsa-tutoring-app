import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { CookieOptions } from '@supabase/ssr'
import { Role } from '@/types/database/schema'

// Helper function to create a Supabase server client
const createServerSupabaseClient = async () => {
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

// Helper function to verify user access
const verifyUserAccess = async () => {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return {
      success: false,
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
      success: false,
      error: 'Profile not found',
      status: 404
    }
  }
  
  const allowedRoles = [Role.Admin, Role.Staff]
  if (!allowedRoles.includes(profile.role as Role)) {
    return {
      success: false,
      error: 'Insufficient permissions',
      status: 403
    }
  }
  
  return {
    success: true,
    user,
    profile
  }
}

// GET endpoint to fetch users with payment status
export async function GET(request: Request) {
  try {
    const auth = await verifyUserAccess()
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    
    const supabase = await createServerSupabaseClient()
    
    // Get URL parameters
    const url = new URL(request.url)
    const name = url.searchParams.get('name')
    const role = url.searchParams.get('role')
    
    // Fetch users with filters
    let query = supabase
      .from('profiles')
      .select('id, first_name, last_name, group, role')
    
    if (name) {
      const searchTerm = `%${name}%`
      query = query.or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm}`)
    }
    
    if (role) {
      if (role === 'null') {
        query = query.is('role', null)
      } else {
        query = query.eq('role', role)
      }
    }
    
    const { data: users, error: usersError } = await query
    
    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 })
    }
    
    // Fetch payment records for all users
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('user_id')
    
    if (paymentsError) {
      return NextResponse.json({ error: paymentsError.message }, { status: 500 })
    }
    
    // Add payment status to each user
    const usersWithPaymentStatus = users.map(user => ({
      ...user,
      has_payment: payments.some(payment => payment.user_id === user.id)
    }))
    
    return NextResponse.json({ users: usersWithPaymentStatus })
  } catch (error) {
    console.error('Error in GET /api/payments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 