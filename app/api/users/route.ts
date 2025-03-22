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

// GET endpoint to fetch users with attendance stats
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
    const group = url.searchParams.get('group')
    const role = url.searchParams.get('role')
    
    // Fetch users with filters
    let query = supabase
      .from('profiles')
      .select('id, first_name, last_name, group, role, student_email, student_phone, parent_email, parent_phone')
    
    if (name) {
      const searchTerm = `%${name}%`
      query = query.or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm}`)
    }
    
    if (group) {
      query = query.eq('group', group)
    }

    if (role) {
      query = query.eq('role', role)
    }
    
    const { data: users, error: usersError } = await query
    
    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 })
    }
    
    // Fetch attendance records for all users
    const { data: attendances, error: attendancesError } = await supabase
      .from('attendances')
      .select('user_id, attendance_type')
    
    if (attendancesError) {
      return NextResponse.json({ error: attendancesError.message }, { status: 500 })
    }
    
    // Calculate attendance stats for each user
    const usersWithStats = users.map(user => {
      const userAttendances = attendances.filter(a => a.user_id === user.id)
      const absentCount = userAttendances.filter(a => a.attendance_type === 'Absent').length
      const excusedCount = userAttendances.filter(a => a.attendance_type === 'Excused').length
      const presentCount = userAttendances.filter(a => a.attendance_type === 'Present').length
      const absenceScore = absentCount * 2 + excusedCount
      
      return {
        ...user,
        attendance_stats: {
          present: presentCount,
          excused: excusedCount,
          absent: absentCount,
          absence_score: absenceScore
        }
      }
    })
    
    // Sort by absence score in descending order
    usersWithStats.sort((a, b) => b.attendance_stats.absence_score - a.attendance_stats.absence_score)
    
    return NextResponse.json({ users: usersWithStats })
  } catch (error) {
    console.error('Error in GET /api/users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH endpoint to update user role and group
export async function PATCH(request: Request) {
  try {
    const auth = await verifyUserAccess()
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    
    const supabase = await createServerSupabaseClient()
    
    // Get update data from request
    const { userId, role, group } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    // Update user profile
    const { data, error } = await supabase
      .from('profiles')
      .update({
        role: role || undefined,
        group: group || undefined
      })
      .eq('id', userId)
      .select()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in PATCH /api/users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 