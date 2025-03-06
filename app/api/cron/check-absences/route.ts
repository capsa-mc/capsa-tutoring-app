import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { CookieOptions } from '@supabase/ssr'
import { Role, AttendanceType, SessionType } from '@/types/database/schema'

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
    
    // Get all tutoring sessions for today
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .eq('date', today)
      .eq('type', SessionType.Tutoring)
    
    if (sessionsError) {
      throw sessionsError
    }
    
    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ message: 'No tutoring sessions found for today' })
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
        
        // Get users who already have attendance records (Present or Excused)
        const { data: existingAttendances, error: attendanceError } = await supabase
          .from('attendances')
          .select('user_id')
          .eq('session_id', session.id)
          .in('attendance_type', [AttendanceType.Present, AttendanceType.Excused])
        
        if (attendanceError) {
          throw attendanceError
        }
        
        // Get users who don't have attendance records
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
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 