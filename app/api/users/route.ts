import { NextResponse } from 'next/server'
import { Role } from '@/types/database/schema'
import { verifyUserAccess, createErrorResponse } from '@/lib/server-supabase'

// GET endpoint to fetch users with attendance stats
export async function GET(request: Request) {
  try {
    const auth = await verifyUserAccess([Role.Admin, Role.Staff])
    if (!auth.success) {
      return createErrorResponse(auth.error, auth.status)
    }
    
    const { supabase } = auth
    
    // Get URL parameters
    const url = new URL(request.url)
    const name = url.searchParams.get('name')
    const group = url.searchParams.get('group')
    const role = url.searchParams.get('role')
    const status = url.searchParams.get('status')
    
    // Fetch users with filters
    let query = supabase
      .from('profiles')
      .select('id, first_name, last_name, group, role, student_email, student_phone, parent_email, parent_phone, status')
    
    if (name) {
      const searchTerm = `%${name}%`
      query = query.or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm}`)
    }
    
    if (group) {
      if (group === 'null') {
        query = query.is('group', null)
      } else {
        query = query.eq('group', group)
      }
    }

    if (role) {
      if (role === 'null') {
        query = query.is('role', null)
      } else {
        query = query.eq('role', role)
      }
    }

    if (status) {
      query = query.eq('status', status)
    }
    
    const { data: users, error: usersError } = await query
    
    if (usersError) {
      return createErrorResponse(usersError.message)
    }
    
    // Fetch attendance records for all users
    const { data: attendances, error: attendancesError } = await supabase
      .from('attendances')
      .select('user_id, attendance_type')
    
    if (attendancesError) {
      return createErrorResponse(attendancesError.message)
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
    return createErrorResponse('Internal server error')
  }
}

// PATCH endpoint to update user role and group
export async function PATCH(request: Request) {
  try {
    const auth = await verifyUserAccess([Role.Admin, Role.Staff])
    if (!auth.success) {
      return createErrorResponse(auth.error, auth.status)
    }
    
    const { supabase } = auth
    
    // Get update data from request
    const { userId, role, group, status } = await request.json()
    
    if (!userId) {
      return createErrorResponse('User ID is required', 400)
    }
    
    // Update user profile
    const { data, error } = await supabase
      .from('profiles')
      .update({
        role: role || undefined,
        group: group || undefined,
        status: status || undefined
      })
      .eq('id', userId)
      .select()
    
    if (error) {
      return createErrorResponse(error.message)
    }
    
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in PATCH /api/users:', error)
    return createErrorResponse('Internal server error')
  }
} 