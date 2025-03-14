import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { CookieOptions } from '@supabase/ssr'
import { Role } from '@/types/database/schema'
import { PostgrestError } from '@supabase/supabase-js'

interface Session {
  date: string
  hours: number
}

interface Attendance {
  user_id: string
  session_id: string
  attendance_type: string
  sessions: Session
}

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

export async function GET(request: Request) {
  try {
    const auth = await verifyUserAccess()
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    
    const supabase = await createServerSupabaseClient()
    
    // Get URL parameters
    const url = new URL(request.url)
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')
    
    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Start date and end date are required' }, { status: 400 })
    }
    
    // First, get all users
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, group')
    
    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }
    
    // Then, get attendance data for the date range
    const { data: attendances, error: attendancesError } = await supabase
      .from('attendances')
      .select(`
        user_id,
        session_id,
        attendance_type,
        sessions!inner (
          date,
          hours
        )
      `)
      .eq('attendance_type', 'Present')
      .gte('sessions.date', startDate)
      .lte('sessions.date', endDate) as { data: Attendance[] | null, error: PostgrestError | null }
    
    if (attendancesError) {
      console.error('Error fetching attendances:', attendancesError)
      return NextResponse.json({ error: 'Failed to fetch attendance data' }, { status: 500 })
    }
    
    // Calculate SSL hours for each user
    const userData = users.map(user => {
      const userAttendances = attendances?.filter(a => a.user_id === user.id) || []
      const totalHours = userAttendances.reduce((sum, attendance) => 
        sum + (attendance.sessions?.hours || 0), 0)
      
      return {
        firstName: user.first_name,
        lastName: user.last_name,
        group: user.group,
        ssl: totalHours
      }
    })
    
    // Return JSON data
    return NextResponse.json(userData)
  } catch (error) {
    console.error('Error in GET /api/users/export:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 