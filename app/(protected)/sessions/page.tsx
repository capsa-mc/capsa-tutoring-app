'use client'

import { useState, useEffect, FormEvent, useCallback } from 'react'
import { SessionType } from '@/types/database/schema'
import { format, addDays } from 'date-fns'

interface Session {
  id: number
  location: string
  start_time: string
  end_time: string
  date: string
  type: SessionType
  comment: string | null
}

interface SessionFormData {
  location: string
  start_time: string
  end_time: string
  date: string
  type: SessionType
  comment: string
}

export default function SessionsPage() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const oneMonthLater = format(addDays(new Date(), 30), 'yyyy-MM-dd')
  
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
    start_time: '15:00:00',
    end_time: '17:00:00',
    date: format(new Date(), 'yyyy-MM-dd'),
    type: SessionType.Tutoring,
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
          start_time: editingSession.start_time,
          end_time: editingSession.end_time,
          date: editingSession.date,
          type: editingSession.type,
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
    if (!editingSession) return
    const { name, value } = e.target
    setEditingSession(prev => prev ? { ...prev, [name]: value } : null)
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                name="start_time"
                required
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={formData.start_time.substring(0, 5)}
                onChange={handleInputChange}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                name="end_time"
                required
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={formData.end_time.substring(0, 5)}
                onChange={handleInputChange}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session Type</label>
              <select
                name="type"
                required
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={formData.type}
                onChange={handleInputChange}
              >
                <option value={SessionType.Tutoring}>Tutoring</option>
                <option value={SessionType.Training}>Training</option>
                <option value={SessionType.Adhoc}>Adhoc</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Comment (Optional)</label>
              <textarea
                name="comment"
                rows={3}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={formData.comment}
                onChange={handleInputChange}
              ></textarea>
            </div>
          </div>
          
          <div className="mt-6">
            <button
              type="submit"
              disabled={formSubmitting}
              className="w-full md:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {formSubmitting ? 'Creating...' : 'Create Session'}
            </button>
          </div>
        </form>
      </div>
      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Filter Sessions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Session Type</label>
            <select
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              <option value={SessionType.Tutoring}>Tutoring</option>
              <option value={SessionType.Training}>Training</option>
              <option value={SessionType.Adhoc}>Adhoc</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      {/* Sessions List */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Sessions List</h2>
        
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            No sessions found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comment</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sessions.map((session) => (
                  <tr key={session.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingSessionId === session.id ? (
                        <input
                          type="date"
                          name="date"
                          value={editingSession?.date || ''}
                          onChange={handleEditChange}
                          className="border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      ) : (
                        session.date
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingSessionId === session.id ? (
                        <input
                          type="text"
                          name="location"
                          value={editingSession?.location || ''}
                          onChange={handleEditChange}
                          className="border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      ) : (
                        session.location
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingSessionId === session.id ? (
                        <div className="flex space-x-2">
                          <input
                            type="time"
                            name="start_time"
                            value={editingSession?.start_time.substring(0, 5) || ''}
                            onChange={handleEditChange}
                            className="border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                          <span>-</span>
                          <input
                            type="time"
                            name="end_time"
                            value={editingSession?.end_time.substring(0, 5) || ''}
                            onChange={handleEditChange}
                            className="border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </div>
                      ) : (
                        `${session.start_time.substring(0, 5)} - ${session.end_time.substring(0, 5)}`
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingSessionId === session.id ? (
                        <select
                          name="type"
                          value={editingSession?.type || ''}
                          onChange={handleEditChange}
                          className="border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                          <option value={SessionType.Tutoring}>Tutoring</option>
                          <option value={SessionType.Training}>Training</option>
                          <option value={SessionType.Adhoc}>Adhoc</option>
                        </select>
                      ) : (
                        session.type
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingSessionId === session.id ? (
                        <textarea
                          name="comment"
                          value={editingSession?.comment || ''}
                          onChange={handleEditChange}
                          rows={2}
                          className="border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      ) : (
                        session.comment
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {editingSessionId === session.id ? (
                        <>
                          <button
                            onClick={() => handleUpdateSession(session.id)}
                            className="px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                          >
                            Update
                          </button>
                          <button
                            onClick={() => handleEditToggle(session)}
                            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEditToggle(session)}
                            className="px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteSession(session.id)}
                            disabled={deletingSessionId === session.id}
                            className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
                          >
                            {deletingSessionId === session.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              'Delete'
                            )}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
    </div>
  )
} 