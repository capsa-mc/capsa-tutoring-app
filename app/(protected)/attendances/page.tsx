'use client'

import { useState, useEffect, useCallback } from 'react'
import { Group, Role, SessionType, AttendanceType, SessionStatus } from '@/types/database/schema'
import { formatInTimeZone, getCurrentDate, formatToISO } from '@/lib/date-utils'

interface Session {
  id: number
  location: string
  hours: number
  date: string
  type: SessionType
  status: SessionStatus
  comment: string | null
}

interface User {
  id: string
  first_name: string | null
  last_name: string | null
  group: Group | null
  role: Role | null
}

interface Attendance {
  id: number
  session_id: number | null
  user_id: string | null
  attendance_type: AttendanceType
}

export default function AttendancesPage() {
  const today = formatToISO(getCurrentDate())
  
  // State for sessions
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)
  const [sessionDate, setSessionDate] = useState<string>(today)
  const [loadingSessions, setLoadingSessions] = useState(false)
  
  // State for users
  const [users, setUsers] = useState<User[]>([])
  const [nameFilter, setNameFilter] = useState('')
  const [groupFilter, setGroupFilter] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(false)
  
  // State for attendances
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [loadingAttendances, setLoadingAttendances] = useState(false)
  
  // State for operations
  const [actionUserId, setActionUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [closingSession, setClosingSession] = useState(false)
  
  // Fetch sessions based on date
  const fetchSessions = useCallback(async () => {
    setLoadingSessions(true)
    setError(null)
    
    try {
      const queryParams = new URLSearchParams()
      queryParams.append('type', 'sessions')
      queryParams.append('date', sessionDate)
      
      const response = await fetch(`/api/attendances?${queryParams.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch sessions')
      }
      
      const result = await response.json()
      setSessions(result.sessions || [])
      
      // Select the session closest to current time if there are sessions
      if (result.sessions && result.sessions.length > 0) {
        // Default to the first session
        let closestSession = result.sessions[0]
        
        // If today's date is selected, find the session with During status
        if (sessionDate === today) {
          const duringSession = result.sessions.find((session: Session) => session.status === SessionStatus.During)
          if (duringSession) {
            closestSession = duringSession
          }
        }
        
        setSelectedSessionId(closestSession.id)
      } else {
        setSelectedSessionId(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoadingSessions(false)
    }
  }, [sessionDate, today])
  
  // Fetch users based on filters
  const fetchUsers = useCallback(async () => {
    if (!selectedSessionId) return
    
    setLoadingUsers(true)
    setError(null)
    
    try {
      const queryParams = new URLSearchParams()
      queryParams.append('type', 'users')
      if (nameFilter) queryParams.append('name', nameFilter)
      if (groupFilter) queryParams.append('group', groupFilter)
      
      const response = await fetch(`/api/attendances?${queryParams.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      
      const result = await response.json()
      // Filter users to show only Tutor, Tutee, and Coordinator
      const filteredUsers = (result.users || []).filter((user: User) => 
        user.role === Role.Tutor || 
        user.role === Role.Tutee || 
        user.role === Role.Coordinator
      )
      setUsers(filteredUsers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoadingUsers(false)
    }
  }, [selectedSessionId, nameFilter, groupFilter])
  
  // Fetch attendances for the selected session
  const fetchAttendances = useCallback(async () => {
    if (!selectedSessionId) return
    
    setLoadingAttendances(true)
    setError(null)
    
    try {
      const queryParams = new URLSearchParams()
      queryParams.append('type', 'attendances')
      queryParams.append('sessionId', selectedSessionId.toString())
      
      const response = await fetch(`/api/attendances?${queryParams.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch attendances')
      }
      
      const result = await response.json()
      setAttendances(result.attendances || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoadingAttendances(false)
    }
  }, [selectedSessionId])
  
  // Initial fetch
  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])
  
  // Fetch users and attendances when session changes
  useEffect(() => {
    if (selectedSessionId) {
      fetchUsers()
      fetchAttendances()
    }
  }, [selectedSessionId, fetchUsers, fetchAttendances])
  
  // Handle session date change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSessionDate(e.target.value)
    // Trigger session fetch immediately when date changes
    fetchSessions()
  }
  
  // Handle session selection
  const handleSessionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = parseInt(e.target.value)
    setSelectedSessionId(id)
  }
  
  // Handle filter changes
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    if (name === 'nameFilter') {
      setNameFilter(value)
    } else if (name === 'groupFilter') {
      setGroupFilter(value)
    }
  }
  
  // Handle check-in
  const handleCheckIn = async (userId: string) => {
    if (!selectedSessionId) return
    
    setActionUserId(userId)
    setError(null)
    setSuccess(null)
    
    try {
      const response = await fetch('/api/attendances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: selectedSessionId,
          user_id: userId,
          attendance_type: AttendanceType.Present
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to check in user')
      }
      
      setSuccess('User checked in successfully')
      
      // Refresh attendances
      fetchAttendances()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setActionUserId(null)
    }
  }
  
  // Handle excuse
  const handleExcuse = async (userId: string) => {
    if (!selectedSessionId) return
    
    setActionUserId(userId)
    setError(null)
    setSuccess(null)
    
    try {
      const response = await fetch('/api/attendances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: selectedSessionId,
          user_id: userId,
          attendance_type: AttendanceType.Excused
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to excuse user')
      }
      
      setSuccess('User excused successfully')
      
      // Refresh attendances
      fetchAttendances()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setActionUserId(null)
    }
  }
  
  // Handle delete attendance
  const handleDeleteAttendance = async (userId: string) => {
    if (!selectedSessionId) return
    
    setActionUserId(userId)
    setError(null)
    setSuccess(null)
    
    try {
      const queryParams = new URLSearchParams()
      queryParams.append('sessionId', selectedSessionId.toString())
      queryParams.append('userId', userId)
      
      const response = await fetch(`/api/attendances?${queryParams.toString()}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete attendance')
      }
      
      setSuccess('Attendance deleted successfully')
      
      // Refresh attendances
      fetchAttendances()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setActionUserId(null)
    }
  }
  
  // Format session display
  const formatSessionDisplay = (session: Session) => {
    const weekday = new Date(session.date).toLocaleDateString('en-US', { weekday: 'short' })
    const date = formatInTimeZone(session.date, 'MMM d, yyyy')
    const statusLabels = {
      [SessionStatus.Before]: '⏳ Not Started',
      [SessionStatus.During]: '▶️ In Progress',
      [SessionStatus.After]: '✅ Completed'
    }
    return `[${weekday}] ${date} - ${session.hours} hours - ${session.type} at ${session.location} [${statusLabels[session.status]}]${session.comment ? ` - 💬 ${session.comment}` : ''}`
  }

  // Get attendance label for a user
  const getAttendanceLabel = (userId: string) => {
    const attendance = attendances.find(a => a.user_id === userId)
    if (!attendance) return null

    const labelStyles = {
      [AttendanceType.Present]: 'bg-green-100 text-green-800',
      [AttendanceType.Excused]: 'bg-amber-100 text-amber-800',
      [AttendanceType.Absent]: 'bg-red-100 text-red-800'
    }

    const icons = {
      [AttendanceType.Present]: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      [AttendanceType.Excused]: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      [AttendanceType.Absent]: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )
    }

    return (
      <div className="flex justify-center">
        <span className={`px-3 py-1.5 rounded-md font-medium text-sm inline-flex items-center ${labelStyles[attendance.attendance_type]}`}>
          {icons[attendance.attendance_type]}
          {attendance.attendance_type}
        </span>
      </div>
    )
  }
  
  // Handle close session
  const handleCloseSession = async () => {
    if (!selectedSessionId) return
    
    setClosingSession(true)
    setError(null)
    setSuccess(null)
    
    try {
      // First update session status to After
      const updateResponse = await fetch('/api/sessions', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: selectedSessionId,
          status: SessionStatus.After
        })
      })

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json()
        throw new Error(errorData.error || 'Failed to update session status')
      }

      // Then mark absent users
      const response = await fetch('/api/attendances', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: selectedSessionId
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to close session')
      }
      
      setSuccess(result.message || 'Session closed successfully')
      
      // Refresh sessions and attendances
      fetchSessions()
      fetchAttendances()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setClosingSession(false)
    }
  }
  
  // Handle start session
  const handleStartSession = async () => {
    if (!selectedSessionId) return
    
    setClosingSession(true)
    setError(null)
    setSuccess(null)
    
    try {
      const updateResponse = await fetch('/api/sessions', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: selectedSessionId,
          status: SessionStatus.During
        })
      })

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json()
        throw new Error(errorData.error || 'Failed to start session')
      }

      setSuccess('Session started successfully')
      
      // Refresh sessions
      fetchSessions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setClosingSession(false)
    }
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Attendance Management</h1>
      
      {/* Session Selector */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Select Session</h2>
          {selectedSessionId && (
            <>
              {sessions.find(s => s.id === selectedSessionId && s.status === SessionStatus.Before) ? (
                <button
                  onClick={handleStartSession}
                  disabled={closingSession || loadingAttendances}
                  className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors ${
                    closingSession || loadingAttendances
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {closingSession ? (
                    <span className="inline-flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Starting Session...
                    </span>
                  ) : (
                    <span className="inline-flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Start Session
                    </span>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleCloseSession}
                  disabled={closingSession || loadingAttendances || !sessions.find(s => 
                    s.id === selectedSessionId && s.status === SessionStatus.During
                  )}
                  className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors ${
                    closingSession || loadingAttendances || !sessions.find(s => 
                      s.id === selectedSessionId && s.status === SessionStatus.During
                    )
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {closingSession ? (
                    <span className="inline-flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Closing Session...
                    </span>
                  ) : (
                    <span className="inline-flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Close Session
                    </span>
                  )}
                </button>
              )}
            </>
          )}
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={sessionDate}
              onChange={handleDateChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Session</label>
            <select
              value={selectedSessionId || ''}
              onChange={handleSessionChange}
              disabled={loadingSessions || sessions.length === 0}
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="" disabled>
                {loadingSessions ? 'Loading sessions...' : sessions.length === 0 ? 'No sessions available' : 'Select a session'}
              </option>
              {sessions.map((session) => {
                return (
                  <option 
                    key={session.id} 
                    value={session.id}
                  >
                    {formatSessionDisplay(session)}
                  </option>
                )
              })}
            </select>
          </div>
        </div>
      </div>
      
      {/* User List and Attendance */}
      {selectedSessionId && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">User Attendance</h2>
          
          {/* User Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                name="nameFilter"
                value={nameFilter}
                onChange={handleFilterChange}
                placeholder="Search by name"
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Group</label>
              <select
                name="groupFilter"
                value={groupFilter}
                onChange={handleFilterChange}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">All Groups</option>
                <option value={Group.LES}>LES</option>
                <option value={Group.UES}>UES</option>
                <option value={Group.MHS}>MHS</option>
                <option value={Group.ADMIN}>ADMIN</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={fetchUsers}
                disabled={loadingUsers}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loadingUsers ? 'Loading...' : 'Filter Users'}
              </button>
            </div>
          </div>
          
          {/* User List */}
          {loadingUsers || loadingAttendances ? (
            <div className="text-center py-4">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent"></div>
              <p className="mt-2 text-gray-600">Loading...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No users found with the selected filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map(user => {
                return (
                  <div key={user.id} className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex flex-col space-y-3">
                      {/* Name and Role */}
                      <div className="flex justify-between items-start">
                        <div className="font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                          ${user.role === Role.Tutor ? 'bg-blue-100 text-blue-800' : 
                            user.role === Role.Tutee ? 'bg-green-100 text-green-800' : 
                            'bg-purple-100 text-purple-800'}`}>
                          {user.role}
                        </span>
                      </div>
                      
                      {/* Group */}
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Group:</span> {user.group}
                      </div>
                      
                      {/* Action Button or Attendance Label */}
                      <div className="pt-2">
                        {(() => {
                          const attendance = attendances.find(a => a.user_id === user.id)
                          const currentSession = sessions.find(s => s.id === selectedSessionId)
                          
                          if (!currentSession) return null

                          // If session status is Before, show grayed out button
                          if (currentSession.status === SessionStatus.Before) {
                            return (
                              <button
                                disabled={true}
                                className="w-full px-3 py-2 bg-gray-300 text-gray-600 rounded-md cursor-not-allowed opacity-60 transition-colors"
                              >
                                <span className="inline-flex items-center justify-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Session Not Started
                                </span>
                              </button>
                            )
                          }

                          // If session status is During
                          if (currentSession.status === SessionStatus.During) {
                            // If user has attendance record
                            if (attendance) {
                              // Show Cancel button for different attendance types
                              const buttonText = {
                                [AttendanceType.Present]: 'Cancel Present',
                                [AttendanceType.Excused]: 'Cancel Excuse',
                                [AttendanceType.Absent]: 'Cancel Absent'
                              }

                              return (
                                <button
                                  onClick={() => handleDeleteAttendance(user.id)}
                                  disabled={actionUserId === user.id}
                                  className="w-full px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
                                >
                                  {actionUserId === user.id ? (
                                    <span className="inline-flex items-center justify-center">
                                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                      Deleting...
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center justify-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                      {buttonText[attendance.attendance_type]}
                                    </span>
                                  )}
                                </button>
                              )
                            }

                            // If user doesn't have attendance record, show Sign In and Excuse buttons
                            return (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleCheckIn(user.id)}
                                  disabled={actionUserId === user.id}
                                  className="flex-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
                                >
                                  {actionUserId === user.id ? (
                                    <span className="inline-flex items-center justify-center">
                                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                      Processing...
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center justify-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                      Sign In
                                    </span>
                                  )}
                                </button>
                                <button
                                  onClick={() => handleExcuse(user.id)}
                                  disabled={actionUserId === user.id}
                                  className="flex-1 px-3 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 transition-colors"
                                >
                                  {actionUserId === user.id ? (
                                    <span className="inline-flex items-center justify-center">
                                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                      Processing...
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center justify-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      Excuse
                                    </span>
                                  )}
                                </button>
                              </div>
                            )
                          }

                          // If session status is After
                          if (currentSession.status === SessionStatus.After) {
                            if (attendance) {
                              return getAttendanceLabel(user.id)
                            }
                            return (
                              <div className="flex justify-center">
                                <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-md font-medium text-sm inline-flex items-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Past Session
                                </span>
                              </div>
                            )
                          }

                          return null
                        })()}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
} 