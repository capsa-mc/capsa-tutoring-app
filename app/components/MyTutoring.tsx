import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { SessionType, AttendanceType, SessionStatus, Role } from '@/types/database/schema'
import { formatInTimeZone, getNYDateString, isSameNYDate } from '@/lib/date-utils'
import AttendanceStats from './AttendanceStats'
import SslFormDownload from './SslFormDownload'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"

interface Session {
  id: number
  location: string
  hours: number
  date: string
  type: SessionType
  status: SessionStatus
  comment: string | null
}

interface Profile {
  id: string
  first_name: string | null
  last_name: string | null
}

interface MyTutoringProps {
  userId: string
  userRole: Role
  tutorInfo?: {
    id: string
    name: string
    pair_id?: number
  } | null
  tuteeInfo?: Array<{
    id: string
    name: string
    pair_id?: number
  }> | null
}

export default function MyTutoring({ userId, userRole, tutorInfo, tuteeInfo }: MyTutoringProps) {
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([])
  const [allSessions, setAllSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [excuseLoading, setExcuseLoading] = useState<number | null>(null)
  const [excusedSessions, setExcusedSessions] = useState<Set<number>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [sslHours, setSslHours] = useState<number>(0)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  
  useEffect(() => {
    const fetchSslHours = async () => {
      try {
        const supabase = createClient()
        
        // Only fetch SSL hours for Coordinator and Tutor roles
        if (userRole !== Role.Coordinator && userRole !== Role.Tutor) {
          return
        }
        
        // Get all sessions where user was present
        const { data: attendances, error: attendanceError } = await supabase
          .from('attendances')
          .select(`
            session_id,
            sessions!inner (
              hours
            )
          `)
          .eq('user_id', userId)
          .eq('attendance_type', AttendanceType.Present)
        
        if (attendanceError) {
          throw attendanceError
        }
        
        // Calculate total hours
        const totalHours = attendances?.reduce((sum, attendance) => {
          const session = attendance.sessions as unknown as { hours: number }
          return sum + (session.hours || 0)
        }, 0) || 0
        
        setSslHours(totalHours)
      } catch (err) {
        console.error('Error fetching SSL hours:', err)
      }
    }
    
    fetchSslHours()
  }, [userId, userRole])
  
  useEffect(() => {
    const fetchAllSessions = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const supabase = createClient()
        
        // Get current date in NY timezone
        const today = getNYDateString()
        
        // Fetch all tutoring sessions
        const { data: sessions, error: sessionError } = await supabase
          .from('sessions')
          .select('*')
          .eq('type', SessionType.Tutoring)
          .or(`date.gt.${today},and(date.eq.${today},status.eq.${SessionStatus.Before})`)
          .order('date', { ascending: true })
        
        if (sessionError) {
          throw sessionError
        }
        
        if (sessions) {
          setAllSessions(sessions)
          
          // If no date is selected, show today's sessions
          if (!selectedDate) {
            const todaySessions = sessions.filter(s => isSameNYDate(s.date, today))
            setUpcomingSessions(todaySessions)
          } else {
            // Show sessions for selected date
            const selectedDateStr = selectedDate.toISOString().split('T')[0]
            const selectedDateSessions = sessions.filter(s => isSameNYDate(s.date, selectedDateStr))
            setUpcomingSessions(selectedDateSessions)
          }
          
          // Check excused status for all sessions
          const excusedSet = new Set<number>()
          
          for (const session of sessions) {
            const { data: attendance, error: attendanceError } = await supabase
              .from('attendances')
              .select('*')
              .eq('session_id', session.id)
              .eq('user_id', userId)
              .eq('attendance_type', AttendanceType.Excused)
              .maybeSingle()
            
            if (attendanceError) {
              throw attendanceError
            }
            
            if (attendance) {
              excusedSet.add(session.id)
            }
          }
          
          setExcusedSessions(excusedSet)
        } else {
          setAllSessions([])
          setUpcomingSessions([])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        console.error('Error fetching sessions:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchAllSessions()
  }, [userId, userRole, selectedDate])
  
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const supabase = createClient()
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()
        
        if (profileError) {
          throw profileError
        }
        
        setProfile(profileData)
      } catch (err) {
        console.error('Error fetching profile:', err)
      }
    }
    
    fetchProfile()
  }, [userId])
  
  const handleExcuse = async (sessionId: number) => {
    setExcuseLoading(sessionId)
    setError(null)
    
    try {
      const supabase = createClient()
      const isExcused = excusedSessions.has(sessionId)
      
      if (isExcused) {
        // Delete the excuse record
        const { error: deleteError } = await supabase
          .from('attendances')
          .delete()
          .eq('session_id', sessionId)
          .eq('user_id', userId)
          .eq('attendance_type', AttendanceType.Excused)
        
        if (deleteError) throw deleteError
        
        setExcusedSessions(prev => {
          const newSet = new Set(prev)
          newSet.delete(sessionId)
          return newSet
        })
      } else {
        // Create new excuse record
        const { error: insertError } = await supabase
          .from('attendances')
          .insert({
            session_id: sessionId,
            user_id: userId,
            attendance_type: AttendanceType.Excused
          })
        
        if (insertError) throw insertError
        
        setExcusedSessions(prev => {
          const newSet = new Set(prev)
          newSet.add(sessionId)
          return newSet
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error managing excuse:', err)
    } finally {
      setExcuseLoading(null)
    }
  }
  
  const formatSessionTime = (session: Session) => {
    return {
      weekday: formatInTimeZone(session.date, 'EEEE'),
      date: formatInTimeZone(session.date, 'MMM d, yyyy'),
      time: `${session.hours} hours`
    }
  }

  // Custom day renderer to highlight dates with sessions
  const renderDayContents = (day: number, date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    const hasSession = allSessions.some(s => s.date === dateStr)
    
    return (
      <div className={`relative ${hasSession ? 'bg-blue-100 rounded-full' : ''}`}>
        {day}
      </div>
    )
  }
  
  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden mt-8">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">My Tutoring</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {/* SSL Hours Section - Only show for Coordinator and Tutor */}
        {(userRole === Role.Coordinator || userRole === Role.Tutor) && (
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">SSL Hours</h3>
                <p className="text-sm text-gray-500">Total hours completed: {sslHours}</p>
              </div>
              <SslFormDownload 
                userRole={userRole}
                firstName={profile?.first_name || null}
                lastName={profile?.last_name || null}
              />
            </div>
          </div>
        )}
        
        {/* Tutor/Tutee Information */}
        <div className="mb-6">
          {tutorInfo && (
            <div className="mb-3">
              <span className="font-medium mr-2">My Tutor:</span>
              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-sm font-medium">
                {tutorInfo.name}
              </span>
            </div>
          )}
          
          {tuteeInfo && tuteeInfo.length > 0 && (
            <div>
              <span className="font-medium mr-2">My Tutees:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {tuteeInfo.map(tutee => (
                  <span key={tutee.id} className="px-2 py-0.5 bg-sky-100 text-sky-800 rounded text-sm font-medium">
                    {tutee.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Attendance Statistics */}
        <AttendanceStats userId={userId} />
        
        {/* Upcoming Sessions */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Upcoming Sessions</h3>
          
          {/* Date Picker */}
          <div className="mb-4">
            <DatePicker
              selected={selectedDate}
              onChange={(date: Date | null) => setSelectedDate(date)}
              renderDayContents={renderDayContents}
              minDate={new Date()}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              dateFormat="MMMM d, yyyy"
            />
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : upcomingSessions.length === 0 ? (
            <p className="text-gray-500">No sessions scheduled for this date.</p>
          ) : (
            <div className="space-y-4">
              {upcomingSessions.map((session) => {
                const time = formatSessionTime(session)
                const isExcused = excusedSessions.has(session.id)
                
                return (
                  <div
                    key={session.id}
                    className="border rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {time.weekday}, {time.date}
                        </h4>
                        <p className="text-sm text-gray-500">{time.time}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Location: {session.location}
                        </p>
                        {session.comment && (
                          <p className="text-sm text-gray-600 mt-2 flex items-start">
                            <svg className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                            <span>{session.comment}</span>
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleExcuse(session.id)}
                        disabled={excuseLoading === session.id}
                        className={`px-3 py-1 rounded-md text-sm font-medium ${
                          isExcused
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        }`}
                      >
                        {excuseLoading === session.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current"></div>
                        ) : isExcused ? (
                          'Excused'
                        ) : (
                          'Request Excuse'
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 