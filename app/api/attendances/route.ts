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

// GET endpoint to fetch sessions, users, and attendances
export async function GET(request: Request) {
  try {
    // Verify user access
    const auth = await verifyUserAccess()
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    
    const supabase = await createServerSupabaseClient()
    
    // Get URL parameters
    const url = new URL(request.url)
    const type = url.searchParams.get('type') // 'sessions', 'users', or 'attendances'
    const date = url.searchParams.get('date')
    const name = url.searchParams.get('name')
    const group = url.searchParams.get('group')
    const sessionId = url.searchParams.get('sessionId')
    
    if (type === 'sessions') {
      // Fetch sessions close to the given date
      let query = supabase
        .from('sessions')
        .select('*')
      
      if (date) {
        // Get sessions on the same date or close to it (±2 days)
        const targetDate = new Date(date)
        const minDate = new Date(targetDate)
        minDate.setDate(minDate.getDate() - 2)
        
        const maxDate = new Date(targetDate)
        maxDate.setDate(maxDate.getDate() + 2)
        
        query = query
          .gte('date', minDate.toISOString().split('T')[0])
          .lte('date', maxDate.toISOString().split('T')[0])
      }
      
      // Order by date and start_time
      query = query.order('date', { ascending: true }).order('start_time', { ascending: true })
      
      // Limit to 5 sessions
      query = query.limit(5)
      
      const { data: sessions, error } = await query
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      return NextResponse.json({ sessions })
    } else if (type === 'users') {
      // Fetch users
      let query = supabase
        .from('profiles')
        .select('id, first_name, last_name, group, role')
      
      // Apply filters if provided
      if (name) {
        const searchTerm = `%${name}%`
        query = query.or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm}`)
      }
      
      if (group) {
        query = query.eq('group', group)
      }
      
      // Order by name
      query = query.order('first_name', { ascending: true }).order('last_name', { ascending: true })
      
      const { data: users, error } = await query
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      return NextResponse.json({ users })
    } else if (type === 'attendances') {
      // Fetch attendances for a specific session
      if (!sessionId) {
        return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
      }
      
      const { data: attendances, error } = await supabase
        .from('attendances')
        .select('*')
        .eq('session_id', sessionId)
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      return NextResponse.json({ attendances })
    } else {
      return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in GET /api/attendances:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST endpoint to check in a user for a session
export async function POST(request: Request) {
  try {
    // Verify user access
    const auth = await verifyUserAccess()
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    
    const supabase = await createServerSupabaseClient()
    
    // Get attendance data from request
    const attendanceData = await request.json()
    
    // Validate required fields
    if (!attendanceData.session_id || !attendanceData.user_id) {
      return NextResponse.json({ error: 'Session ID and User ID are required' }, { status: 400 })
    }
    
    // Check if attendance already exists
    const { data: existingAttendance, error: checkError } = await supabase
      .from('attendances')
      .select('*')
      .eq('session_id', attendanceData.session_id)
      .eq('user_id', attendanceData.user_id)
      .maybeSingle()
    
    if (checkError) {
      return NextResponse.json({ error: checkError.message }, { status: 500 })
    }
    
    if (existingAttendance) {
      return NextResponse.json({ error: 'User is already checked in for this session' }, { status: 409 })
    }
    
    // Insert new attendance
    const { data, error } = await supabase
      .from('attendances')
      .insert([{
        ...attendanceData,
        attendance_type: 'Present'
      }])
      .select()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in POST /api/attendances:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE endpoint to remove a user's attendance for a session
export async function DELETE(request: Request) {
  try {
    // Verify user access
    const auth = await verifyUserAccess()
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    
    const supabase = await createServerSupabaseClient()
    
    // Get URL parameters
    const url = new URL(request.url)
    const sessionId = url.searchParams.get('sessionId')
    const userId = url.searchParams.get('userId')
    
    // Validate required parameters
    if (!sessionId || !userId) {
      return NextResponse.json({ error: 'Session ID and User ID are required' }, { status: 400 })
    }
    
    // Delete the attendance record
    const { error } = await supabase
      .from('attendances')
      .delete()
      .eq('session_id', sessionId)
      .eq('user_id', userId)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/attendances:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 