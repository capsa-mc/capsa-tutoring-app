'use client'

import { useState, useEffect, useCallback } from 'react'
import { Group, Role } from '@/types/database/schema'

interface User {
  id: string
  first_name: string | null
  last_name: string | null
  group: Group | null
  role: Role | null
  attendance_stats: {
    present: number
    excused: number
    absent: number
    absence_score: number
  }
}

export default function UsersPage() {
  // State for users
  const [users, setUsers] = useState<User[]>([])
  const [nameFilter, setNameFilter] = useState('')
  const [groupFilter, setGroupFilter] = useState('')
  const [loading, setLoading] = useState(false)
  
  // State for editing
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  
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
  }, [nameFilter, groupFilter])
  
  // Initial fetch
  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])
  
  // Handle filter changes
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    if (name === 'nameFilter') {
      setNameFilter(value)
    } else if (name === 'groupFilter') {
      setGroupFilter(value)
    }
  }
  
  // Handle edit button click
  const handleEditClick = (user: User) => {
    setEditingUserId(user.id)
    setEditingRole(user.role)
    setEditingGroup(user.group)
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
          group: editingGroup
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
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
            {Object.values(Group).map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
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
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {user.group}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Attendance Stats */}
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="inline-flex items-center px-2 py-1 rounded bg-green-50 text-green-700">
                        Present: {user.attendance_stats.present}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded bg-yellow-50 text-yellow-700">
                        Excused: {user.attendance_stats.excused}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded bg-red-50 text-red-700">
                        Absent: {user.attendance_stats.absent}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded bg-gray-50 text-gray-700">
                        Score: {user.attendance_stats.absence_score}
                      </span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-2">
                    {editingUserId === user.id ? (
                      <>
                        <button
                          onClick={handleSaveEdit}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleEditClick(user)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Edit
                      </button>
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