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
  
  // Use getUser instead of getSession for better security
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return {
      success: false,
      error: 'Unauthorized',
      status: 401
    }
  }
  
  // Get user profile to check role
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
  
  // Check if user has admin, staff, or coordinator role
  const allowedRoles = [Role.Admin, Role.Staff, Role.Coordinator]
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

export async function GET(request: Request) {
  try {
    // Verify user access
    const auth = await verifyUserAccess()
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    
    const supabase = await createServerSupabaseClient()
    
    // Get URL parameters for filtering
    const url = new URL(request.url)
    const type = url.searchParams.get('type')
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')
    
    // Build query
    let query = supabase
      .from('sessions')
      .select('*')
      .order('date', { ascending: true })
    
    // Apply filters if provided
    if (type) {
      query = query.eq('type', type)
    }
    
    if (startDate) {
      query = query.gte('date', startDate)
    }
    
    if (endDate) {
      query = query.lte('date', endDate)
    }
    
    // Execute query
    const { data, error } = await query
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in GET /api/sessions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Verify user access
    const auth = await verifyUserAccess()
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    
    const supabase = await createServerSupabaseClient()
    
    // Get session data from request
    const sessionData = await request.json()
    
    // Insert new session
    const { data, error } = await supabase
      .from('sessions')
      .insert([sessionData])
      .select()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in POST /api/sessions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    // Verify user access
    const auth = await verifyUserAccess()
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    
    const supabase = await createServerSupabaseClient()
    
    // Get session ID from URL
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }
    
    // Delete the session
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', id)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/sessions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 