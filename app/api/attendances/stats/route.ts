import { createClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { AttendanceType, SessionType } from '@/types/database/schema'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const supabase = createClient()

    // Get all attendance records for tutoring sessions
    const { data: attendances, error: attendanceError } = await supabase
      .from('attendances')
      .select(`
        attendance_type,
        sessions!inner (
          type
        )
      `)
      .eq('user_id', userId)
      .eq('sessions.type', SessionType.Tutoring)

    if (attendanceError) {
      return NextResponse.json({ error: attendanceError.message }, { status: 500 })
    }

    // Count attendance types
    const stats = {
      present: 0,
      excused: 0,
      absent: 0
    }

    attendances?.forEach(attendance => {
      switch (attendance.attendance_type) {
        case AttendanceType.Present:
          stats.present++
          break
        case AttendanceType.Excused:
          stats.excused++
          break
        case AttendanceType.Absent:
          stats.absent++
          break
      }
    })

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Error in GET /api/attendances/stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 