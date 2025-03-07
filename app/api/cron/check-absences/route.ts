import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Role, AttendanceType, SessionType } from '@/types/database/schema'

// Helper function to create a Supabase server client
const createServerSupabaseClient = async () => {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        name: 'sb',
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7,
      },
      cookies: cookieStore,
    }
  )
}

export async function GET(request: Request) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient()
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0]
    console.log('Checking sessions for date:', today)
    
    // First try to get today's sessions
    const { data: todaySessions, error: todayError } = await supabase
      .from('sessions')
      .select('*')
      .eq('type', SessionType.Tutoring)
      .eq('date', today)
    
    if (todayError) {
      console.error('Error getting today\'s sessions:', todayError)
      throw todayError
    }
    
    let sessions = todaySessions
    
    // If no sessions today, get the most recent past session
    if (!sessions || sessions.length === 0) {
      console.log('No sessions found for today, checking most recent past session...')
      const { data: pastSessions, error: pastError } = await supabase
        .from('sessions')
        .select('*')
        .eq('type', SessionType.Tutoring)
        .lt('date', today)
        .order('date', { ascending: false })
        .limit(1)
      
      if (pastError) {
        console.error('Error getting past sessions:', pastError)
        throw pastError
      }
      
      if (!pastSessions || pastSessions.length === 0) {
        console.log('No past sessions found')
        return NextResponse.json({ message: 'No tutoring sessions found' })
      }
      
      sessions = pastSessions
      console.log('Found past sessions for date:', pastSessions[0].date)
    } else {
      console.log('Found today\'s sessions:', sessions.length)
    }
    
    const results = []
    
    // Process each session
    for (const session of sessions) {
      // Get present count for this session
      const { count: presentCount, error: countError } = await supabase
        .from('attendances')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', session.id)
        .eq('attendance_type', AttendanceType.Present)
      
      if (countError) {
        throw countError
      }
      
      if (presentCount && presentCount > 3) {
        // Get all users who should be present (Tutors, Tutees, Coordinators)
        const { data: users, error: usersError } = await supabase
          .from('profiles')
          .select('id')
          .in('role', [Role.Tutor, Role.Tutee, Role.Coordinator])
        
        if (usersError) {
          throw usersError
        }
        
        if (!users || users.length === 0) {
          continue
        }
        
        // Get users who already have attendance records (Present, Excused, or Absent)
        const { data: existingAttendances, error: attendanceError } = await supabase
          .from('attendances')
          .select('user_id')
          .eq('session_id', session.id)
          .in('attendance_type', [AttendanceType.Present, AttendanceType.Excused, AttendanceType.Absent])
        
        if (attendanceError) {
          throw attendanceError
        }
        
        // Get users who don't have any attendance records
        const existingUserIds = existingAttendances?.map(a => a.user_id) || []
        const absentUsers = users.filter(user => !existingUserIds.includes(user.id))
        
        if (absentUsers.length > 0) {
          // Create Absent records for users without attendance
          const { error: insertError } = await supabase
            .from('attendances')
            .insert(
              absentUsers.map(user => ({
                session_id: session.id,
                user_id: user.id,
                attendance_type: AttendanceType.Absent
              }))
            )
          
          if (insertError) {
            throw insertError
          }
          
          results.push({
            session_id: session.id,
            marked_absent_count: absentUsers.length
          })
        }
      }
    }
    
    return NextResponse.json({
      message: 'Absence check completed',
      results
    })
    
  } catch (error) {
    console.error('Error in check-absences cron job:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 