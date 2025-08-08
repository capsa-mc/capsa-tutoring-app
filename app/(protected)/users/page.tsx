'use client'

import { useState, useEffect, useCallback } from 'react'
import { Group, Role, Status } from '@/types/database/schema'
import { format } from 'date-fns'
import { ThemedButton, StatusBadge } from '@/app/components'

interface User {
  id: string
  first_name: string | null
  last_name: string | null
  group: Group | null
  role: Role | null
  student_email: string | null
  student_phone: string | null
  parent_email: string | null
  parent_phone: string | null
  attendance_stats: {
    present: number
    excused: number
    absent: number
    absence_score: number
  }
  status: Status
}

interface SSLUserData {
  firstName: string
  lastName: string
  group: string
  ssl: number
}

// Format phone number to (000)000-0000
const formatPhoneNumber = (phone: string | null): string => {
  if (!phone) return ''
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '')
  // Format the number
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
  if (match) {
    return '(' + match[1] + ')' + match[2] + '-' + match[3]
  }
  return phone // Return original if format doesn't match
}

export default function UsersPage() {
  // State for users
  const [users, setUsers] = useState<User[]>([])
  const [nameFilter, setNameFilter] = useState('')
  const [groupFilter, setGroupFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(false)
  
  // State for date range
  const [startDate, setStartDate] = useState(format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [exportLoading, setExportLoading] = useState(false)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [hasSSLFiles, setHasSSLFiles] = useState(false)
  
  // State for editing
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [editingStatus, setEditingStatus] = useState<Status | null>(null)
  
  // State for operations
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Fetch users based on filters
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const queryParams = new URLSearchParams()
      if (nameFilter) queryParams.append('name', nameFilter)
      if (groupFilter) queryParams.append('group', groupFilter)
      if (roleFilter) queryParams.append('role', roleFilter)
      if (statusFilter) queryParams.append('status', statusFilter)
      
      const response = await fetch(`/api/users?${queryParams.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      
      const result = await response.json()
      setUsers(result.users || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [nameFilter, groupFilter, roleFilter, statusFilter])
  
  // Initial fetch
  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])
  
  // Check for existing SSL files
  useEffect(() => {
    const checkSSLFiles = async () => {
      try {
        const response = await fetch('/api/ssl/bucket')
        const data = await response.json()
        setHasSSLFiles(data.exists)
      } catch (error) {
        console.error('Error checking SSL files:', error)
      }
    }
    checkSSLFiles()
  }, [])
  
  // Handle filter changes
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    if (name === 'nameFilter') {
      setNameFilter(value)
    } else if (name === 'groupFilter') {
      setGroupFilter(value)
    } else if (name === 'roleFilter') {
      setRoleFilter(value)
    } else if (name === 'statusFilter') {
      setStatusFilter(value)
    }
  }
  
  // Handle edit button click
  const handleEditClick = (user: User) => {
    setEditingUserId(user.id)
    setEditingRole(user.role)
    setEditingGroup(user.group)
    setEditingStatus(user.status)
  }
  
  // Handle save edit
  const handleSaveEdit = async () => {
    if (!editingUserId) return
    
    setError(null)
    setSuccess(null)
    
    try {
      const response = await fetch('/api/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: editingUserId,
          role: editingRole,
          group: editingGroup,
          status: editingStatus
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update user')
      }
      
      setSuccess('User updated successfully')
      setEditingUserId(null)
      
      // Refresh users list
      fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }
  
  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingUserId(null)
    setEditingRole(null)
    setEditingGroup(null)
    setEditingStatus(null)
  }
  
  // Handle PDF file change
  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      setPdfFile(file)
    } else {
      setError('Please select a valid PDF file')
    }
  }
  
  // Handle SSL export
  const handleExportSSL = async () => {
    if (!pdfFile) {
      setError('Please select a PDF template file')
      return
    }
    
    setExportLoading(true)
    setError(null)
    
    try {
      // First, upload the PDF template
      const formData = new FormData()
      formData.append('pdf', pdfFile)
      
      const uploadResponse = await fetch('/api/ssl/bucket', {
        method: 'POST',
        body: formData
      })
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload PDF template')
      }
      
      // Then, get the SSL data
      const response = await fetch(`/api/users/export?startDate=${startDate}&endDate=${endDate}`)
      
      if (!response.ok) {
        throw new Error('Failed to generate SSL data')
      }
      
      const data = await response.json() as SSLUserData[]
      
      // Format the data according to the specified structure
      const formattedData = data.map((user) => ({
        name: `${user.lastName}, ${user.firstName}`,
        group: `CAPSA-MC, ${user.group}`,
        startDate: format(new Date(startDate), 'M/d/yyyy'),
        endDate: format(new Date(endDate), 'M/d/yyyy'),
        ssl: user.ssl.toString()
      }))
      
      // Save the JSON data
      const response2 = await fetch('/api/ssl/bucket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formattedData)
      })
      
      if (!response2.ok) {
        throw new Error('Failed to save SSL data')
      }
      
      setHasSSLFiles(true)
      setSuccess('SSL data and PDF template saved successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving SSL data')
    } finally {
      setExportLoading(false)
    }
  }
  
  // Handle disable SSL download
  const handleDisableSSL = async () => {
    setExportLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/ssl/bucket', {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete SSL files')
      }
      
      setHasSSLFiles(false)
      setSuccess('SSL files deleted successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while deleting SSL files')
    } finally {
      setExportLoading(false)
    }
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      
     
      {/* SSL Export Section */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Export SSL Hours</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
        
        {/* PDF Template Upload and Action Button */}
        <div className="mt-4 flex gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="pdfTemplate" className="block text-sm font-medium text-gray-700 mb-1">
              PDF Template
            </label>
            <input
              type="file"
              id="pdfTemplate"
              accept=".pdf"
              onChange={handlePdfChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
            {pdfFile && (
              <p className="mt-1 text-sm text-gray-500">
                Selected file: {pdfFile.name}
              </p>
            )}
          </div>
          
          <div className="w-48">
            {hasSSLFiles ? (
              <ThemedButton
                onClick={handleDisableSSL}
                disabled={exportLoading}
                variant="danger"
                loading={exportLoading}
                className="w-full"
              >
                {exportLoading ? 'Deleting SSL files...' : 'Disable SSL Download'}
              </ThemedButton>
            ) : (
              <ThemedButton
                onClick={handleExportSSL}
                disabled={exportLoading || !pdfFile}
                variant="primary"
                loading={exportLoading}
                className="w-full"
              >
                {exportLoading ? 'Saving SSL data...' : 'Enable SSL Download'}
              </ThemedButton>
            )}
          </div>
        </div>
      </div>

       {/* Filters */}
       <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label htmlFor="nameFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Name
            </label>
            <input
              type="text"
              id="nameFilter"
              name="nameFilter"
              value={nameFilter}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Search by name..."
            />
          </div>
          
          <div>
            <label htmlFor="groupFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Group
            </label>
            <select
              id="groupFilter"
              name="groupFilter"
              value={groupFilter}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Groups</option>
              <option value="null">No Group</option>
              {Object.values(Group).map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="roleFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Role
            </label>
            <select
              id="roleFilter"
              name="roleFilter"
              value={roleFilter}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Roles</option>
              <option value="null">No Role</option>
              {Object.values(Role).map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Status
            </label>
            <select
              id="statusFilter"
              name="statusFilter"
              value={statusFilter}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Statuses</option>
              {Object.values(Status).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      
      {/* Error and Success Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
          {success}
        </div>
      )}
      
      {/* Users List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-4 text-center">Loading...</div>
        ) : users.length === 0 ? (
          <div className="p-4 text-center">No users found</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {users.map((user) => (
              <div key={user.id} className="p-4">
                {/* User Card */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                      {/* Name */}
                      <div className="text-sm font-medium text-gray-900">
                        {user.first_name} {user.last_name}
                      </div>
                      
                      {/* Role */}
                      <div className="flex items-center gap-2">
                        {editingUserId === user.id ? (
                          <select
                            value={editingRole || ''}
                            onChange={(e) => setEditingRole(e.target.value as Role)}
                            className="text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 py-1"
                          >
                            {Object.values(Role).map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {user.role}
                          </span>
                        )}
                      </div>
                      
                      {/* Group */}
                      <div className="flex items-center gap-2">
                        {editingUserId === user.id ? (
                          <select
                            value={editingGroup || ''}
                            onChange={(e) => setEditingGroup(e.target.value as Group)}
                            className="text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 py-1"
                          >
                            {Object.values(Group).map((group) => (
                              <option key={group} value={group}>
                                {group}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <StatusBadge variant="info">
                            {user.group}
                          </StatusBadge>
                        )}
                      </div>

                      {/* Status */}
                      <div className="flex items-center gap-2">
                        {editingUserId === user.id ? (
                          <select
                            value={editingStatus || ''}
                            onChange={(e) => setEditingStatus(e.target.value as Status)}
                            className="text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 py-1"
                          >
                            {Object.values(Status).map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.status === Status.Active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.status}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Attendance Stats */}
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <StatusBadge variant="success">
                        Present: {user.attendance_stats.present}
                      </StatusBadge>
                      <StatusBadge variant="warning">
                        Excused: {user.attendance_stats.excused}
                      </StatusBadge>
                      <StatusBadge variant="error">
                        Absent: {user.attendance_stats.absent}
                      </StatusBadge>
                      <StatusBadge variant="warning">
                        Absent Score: {user.attendance_stats.absence_score}
                      </StatusBadge>
                    </div>

                    {/* Contact Info */}
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      {user.student_email && (
                        <StatusBadge variant="info">
                          Student Email: {user.student_email}
                        </StatusBadge>
                      )}
                      {user.student_phone && (
                        <StatusBadge variant="info">
                          Student Phone: {formatPhoneNumber(user.student_phone)}
                        </StatusBadge>
                      )}
                      {user.parent_email && (
                        <span className="inline-flex items-center px-2 py-1 rounded bg-purple-50 text-purple-700">
                          Parent Email: {user.parent_email}
                        </span>
                      )}
                      {user.parent_phone && (
                        <span className="inline-flex items-center px-2 py-1 rounded bg-orange-50 text-orange-700">
                          Parent Phone: {formatPhoneNumber(user.parent_phone)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-2">
                    {editingUserId === user.id ? (
                      <>
                        <ThemedButton
                          onClick={handleSaveEdit}
                          variant="primary"
                          size="sm"
                        >
                          Save
                        </ThemedButton>
                        <ThemedButton
                          onClick={handleCancelEdit}
                          variant="ghost"
                          size="sm"
                        >
                          Cancel
                        </ThemedButton>
                      </>
                    ) : (
                      <ThemedButton
                        onClick={() => handleEditClick(user)}
                        variant="outline"
                        size="sm"
                      >
                        Edit
                      </ThemedButton>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 