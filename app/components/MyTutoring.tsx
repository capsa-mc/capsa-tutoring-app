import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { SessionType, AttendanceType, SessionStatus } from '@/types/database/schema'
import { formatInTimeZone } from '@/lib/date-utils'
import { Role } from '@/types/database/schema'

interface Session {
  id: number
  location: string
  hours: number
  date: string
  type: SessionType
  status: SessionStatus
  comment: string | null
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
  const [loading, setLoading] = useState(true)
  const [excuseLoading, setExcuseLoading] = useState<number | null>(null)
  const [excusedSessions, setExcusedSessions] = useState<Set<number>>(new Set())
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const fetchUpcomingSessions = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const supabase = createClient()
        
        // Get current date
        const today = new Date().toISOString().split('T')[0]
        
        // Fetch upcoming tutoring sessions
        const { data: sessions, error: sessionError } = await supabase
          .from('sessions')
          .select('*')
          .eq('type', SessionType.Tutoring)
          .or(`date.gt.${today},and(date.eq.${today},status.eq.${SessionStatus.Before})`)
          .order('date', { ascending: true })
        
        if (sessionError) {
          throw sessionError
        }
        
        if (sessions && sessions.length > 0) {
          // Get the next date that has sessions
          const nextDate = sessions[0].date
          const nextDateSessions = sessions.filter(s => s.date === nextDate)
          
          // Show all sessions for all roles
          setUpcomingSessions(nextDateSessions)
          
          // Check excused status for all sessions
          const excusedSet = new Set<number>()
          
          for (const session of nextDateSessions) {
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
          setUpcomingSessions([])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        console.error('Error fetching upcoming sessions:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchUpcomingSessions()
  }, [userId, userRole])
  
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
  
  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden mt-8">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">My Tutoring</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
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
        
        {/* Upcoming Sessions */}
        <div>
          <h3 className="font-medium mb-2">Upcoming Sessions:</h3>
          
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-sky-500"></div>
            </div>
          ) : upcomingSessions.length > 0 ? (
            <div className="space-y-4">
              {upcomingSessions.map(session => (
                <div key={session.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      {/* Weekday */}
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded text-sm font-medium">
                          {formatSessionTime(session).weekday}
                        </span>
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-sm font-medium">
                          {session.type}
                        </span>
                      </div>
                      
                      {/* Date and Time */}
                      <p className="text-gray-900">
                        <span className="font-medium">{formatSessionTime(session).date}</span>
                        <span className="mx-2 text-gray-400">|</span>
                        <span className="text-sky-600">{formatSessionTime(session).time}</span>
                      </p>
                      
                      {/* Location */}
                      <p className="text-gray-600 text-sm flex items-center">
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {session.location}
                      </p>

                      {/* Comment */}
                      {session.comment && (
                        <p className="text-gray-600 text-sm flex items-center">
                          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                          {session.comment}
                        </p>
                      )}
                    </div>
                    
                    <button
                      onClick={() => handleExcuse(session.id)}
                      disabled={excuseLoading !== null}
                      className={`px-4 py-2 rounded-md text-white transition-colors
                        ${excusedSessions.has(session.id)
                          ? 'bg-red-500 hover:bg-red-600' 
                          : 'bg-sky-500 hover:bg-sky-600'
                        } disabled:opacity-50`}
                    >
                      {excuseLoading === session.id ? (
                        <span className="inline-flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </span>
                      ) : excusedSessions.has(session.id) ? 'Cancel' : 'Excuse'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No upcoming tutoring sessions.</p>
          )}
        </div>
      </div>
    </div>
  )
} 