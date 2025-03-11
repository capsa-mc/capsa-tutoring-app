'use client'

import { useState, useEffect, FormEvent, useCallback } from 'react'
import { SessionType, SessionStatus } from '@/types/database/schema'
import { addDays } from 'date-fns'
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

interface SessionFormData {
  location: string
  hours: number
  date: string
  type: SessionType
  status: SessionStatus
  comment: string
}

export default function SessionsPage() {
  const today = formatToISO(getCurrentDate())
  const oneMonthLater = formatToISO(addDays(getCurrentDate(), 30))
  
  // State for sessions list
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // State for filters
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [startDateFilter, setStartDateFilter] = useState<string>(today)
  const [endDateFilter, setEndDateFilter] = useState<string>(oneMonthLater)
  
  // State for form
  const [formData, setFormData] = useState<SessionFormData>({
    location: 'Robert Frost Middle School',
    hours: 2,
    date: formatToISO(getCurrentDate()),
    type: SessionType.Tutoring,
    status: SessionStatus.Before,
    comment: ''
  })
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formSuccess, setFormSuccess] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  
  // Add state for delete operation
  const [deletingSessionId, setDeletingSessionId] = useState<number | null>(null)
  
  // Add state for editing
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null)
  const [editingSession, setEditingSession] = useState<Session | null>(null)
  
  // Fetch sessions based on filters
  const fetchSessions = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const queryParams = new URLSearchParams()
      if (typeFilter) queryParams.append('type', typeFilter)
      if (startDateFilter) queryParams.append('startDate', startDateFilter)
      if (endDateFilter) queryParams.append('endDate', endDateFilter)
      
      const response = await fetch(`/api/sessions?${queryParams.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch sessions')
      }
      
      const result = await response.json()
      setSessions(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [typeFilter, startDateFilter, endDateFilter])
  
  // Initial fetch
  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormSubmitting(true)
    setFormError(null)
    setFormSuccess(false)
    
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create session')
      }
      
      setFormSuccess(true)
      // Refresh sessions list
      fetchSessions()
      
      // We don't reset the form data as per requirements
      // This allows users to easily add multiple sessions with similar data
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setFormSubmitting(false)
    }
  }
  
  // Handle session deletion
  const handleDeleteSession = async (id: number) => {
    if (confirm('Are you sure you want to delete this session?')) {
      setDeletingSessionId(id)
      
      try {
        const response = await fetch(`/api/sessions?id=${id}`, {
          method: 'DELETE',
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to delete session')
        }
        
        // Refresh sessions list
        fetchSessions()
      } catch (err) {
        console.error('Error deleting session:', err)
      } finally {
        setDeletingSessionId(null)
      }
    }
  }
  
  // Handle session update
  const handleUpdateSession = async (id: number) => {
    if (!editingSession) return

    try {
      const response = await fetch('/api/sessions', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id,
          location: editingSession.location,
          hours: editingSession.hours,
          date: editingSession.date,
          type: editingSession.type,
          status: editingSession.status,
          comment: editingSession.comment
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update session')
      }

      setEditingSessionId(null)
      setEditingSession(null)
      // Refresh sessions list
      fetchSessions()
    } catch (err) {
      console.error('Error updating session:', err)
    }
  }

  // Handle edit mode toggle
  const handleEditToggle = (session: Session) => {
    if (editingSessionId === session.id) {
      setEditingSessionId(null)
      setEditingSession(null)
    } else {
      setEditingSessionId(session.id)
      setEditingSession(session)
    }
  }

  // Handle edit input changes
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    if (!editingSession) return
    
    setEditingSession({
      ...editingSession,
      [name]: value
    })
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Sessions Management</h1>
      
      {/* Add New Session Form */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Add New Session</h2>
        
        {formSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            Session created successfully!
          </div>
        )}
        
        {formError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {formError}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                name="date"
                required
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={formData.date}
                onChange={handleInputChange}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                name="location"
                required
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={formData.location}
                onChange={handleInputChange}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hours</label>
              <input
                type="number"
                name="hours"
                required
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={formData.hours}
                onChange={handleInputChange}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                name="type"
                required
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={formData.type}
                onChange={handleInputChange}
              >
                {Object.values(SessionType).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                required
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={formData.status}
                onChange={handleInputChange}
              >
                {Object.values(SessionStatus).map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
              <input
                type="text"
                name="comment"
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={formData.comment || ''}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          <div className="mt-6">
            <button
              type="submit"
              disabled={formSubmitting}
              className="w-full md:w-auto px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {formSubmitting ? 'Creating...' : 'Create Session'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Sessions List */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Sessions List</h2>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">All Types</option>
              {Object.values(SessionType).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No sessions found.</p>
        ) : (
          <div className="space-y-4">
            {sessions.map(session => (
              <div
                key={session.id}
                className="bg-gray-50 rounded-lg p-4 transition-all hover:shadow-md"
              >
                {editingSessionId === session.id ? (
                  // Editing mode
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <input
                          type="date"
                          name="date"
                          value={editingSession?.date || ''}
                          onChange={handleEditChange}
                          className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                        <input
                          type="text"
                          name="location"
                          value={editingSession?.location || ''}
                          onChange={handleEditChange}
                          className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hours</label>
                        <input
                          type="number"
                          name="hours"
                          value={editingSession?.hours || 0}
                          onChange={handleEditChange}
                          className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select
                          name="type"
                          value={editingSession?.type || ''}
                          onChange={handleEditChange}
                          className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                          {Object.values(SessionType).map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                          name="status"
                          value={editingSession?.status || ''}
                          onChange={handleEditChange}
                          className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                          {Object.values(SessionStatus).map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
                        <input
                          type="text"
                          name="comment"
                          value={editingSession?.comment || ''}
                          onChange={handleEditChange}
                          className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleUpdateSession(session.id)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Update
                      </button>
                      <button
                        onClick={() => handleEditToggle(session)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // Display mode
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-6 mb-4 md:mb-0">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-sm font-medium">
                          {formatInTimeZone(session.date, 'EEEE')}
                        </span>
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded text-sm font-medium">
                          {formatInTimeZone(session.date, 'MMM d, yyyy')}
                        </span>
                        <span className="px-2 py-0.5 bg-sky-100 text-sky-800 rounded text-sm font-medium">
                          {session.type}
                        </span>
                        {(() => {
                          const statusColors = {
                            [SessionStatus.Before]: 'bg-blue-100 text-blue-800',
                            [SessionStatus.During]: 'bg-green-100 text-green-800',
                            [SessionStatus.After]: 'bg-gray-100 text-gray-800'
                          }

                          const statusIcons = {
                            [SessionStatus.Before]: '⏳',
                            [SessionStatus.During]: '▶️',
                            [SessionStatus.After]: '✅'
                          }

                          return (
                            <span className={`px-2 py-0.5 rounded text-sm font-medium ${statusColors[session.status]}`}>
                              {statusIcons[session.status]} {session.status}
                            </span>
                          )
                        })()}
                      </div>
                      
                      <div className="text-gray-600">
                        <span className="font-medium">{session.hours} hours</span>
                      </div>
                      
                      <div className="flex items-center text-gray-600">
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {session.location}
                      </div>
                      
                      {session.comment && (
                        <div className="text-gray-500 text-sm">
                          💬 {session.comment}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditToggle(session)}
                        className="px-3 py-1.5 bg-sky-500 text-white rounded-md hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        disabled={deletingSessionId === session.id}
                        className="px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                      >
                        {deletingSessionId === session.id ? (
                          <span className="inline-flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Deleting...
                          </span>
                        ) : 'Delete'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 