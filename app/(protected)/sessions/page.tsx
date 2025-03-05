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
  const [deleteError, setDeleteError] = useState<string | null>(null)
  
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
      setDeleteError(null)
      
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
        setDeleteError(err instanceof Error ? err.message : 'An error occurred while deleting the session')
        console.error('Error deleting session:', err)
      } finally {
        setDeletingSessionId(null)
      }
    }
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
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Sessions List</h2>
        
        {deleteError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {deleteError}
          </div>
        )}
        
        {loading ? (
          <div className="text-center py-4">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent"></div>
            <p className="mt-2 text-gray-600">Loading sessions...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No sessions found for the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comment</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sessions.map((session) => (
                  <tr key={session.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{session.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {session.start_time.substring(0, 5)} - {session.end_time.substring(0, 5)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{session.location}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${session.type === SessionType.Tutoring ? 'bg-green-100 text-green-800' : 
                          session.type === SessionType.Training ? 'bg-blue-100 text-blue-800' : 
                          'bg-yellow-100 text-yellow-800'}`}>
                        {session.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{session.comment || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        disabled={deletingSessionId === session.id}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
                      >
                        {deletingSessionId === session.id ? (
                          <span className="inline-flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Deleting...
                          </span>
                        ) : (
                          <span className="inline-flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </span>
                        )}
                      </button>
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