'use client'

import { useState, useEffect, useCallback } from 'react'
import { Group, Role } from '@/types/database/schema'
import { theme } from '@/app/styles/theme'
import FormInput from '@/app/components/forms/FormInput'
import FormSelect from '@/app/components/forms/FormSelect'
import { createClient, getCurrentUser, getUserProfile } from '@/lib/supabase'
import { Dialog } from '@/app/components/Dialog'
import { toast } from 'react-hot-toast'

interface Application {
  id: string
  first_name: string | null
  last_name: string | null
  student_email: string | null
  group: Group | null
  role: Role | null
  apply_role: Role | null
}

interface ConfirmDialogProps {
  isOpen: boolean
  action: 'approve' | 'reject'
  application: Application | null
  onConfirm: () => void
  onCancel: () => void
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nameFilter, setNameFilter] = useState('')
  const [groupFilter, setGroupFilter] = useState('')
  const [userRole, setUserRole] = useState<Role | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogProps>({
    isOpen: false,
    action: 'approve',
    application: null,
    onConfirm: () => {},
    onCancel: () => {},
  })
  
  // Fetch applications
  const fetchApplications = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Build query parameters
      const params = new URLSearchParams()
      if (nameFilter) params.append('name', nameFilter)
      if (groupFilter) params.append('group', groupFilter)
      
      // Fetch applications from API
      const response = await fetch(`/api/applications?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }
      
      const data = await response.json()
      setApplications(data.applications || [])
    } catch (err) {
      console.error('Error fetching applications:', err)
      setError('Failed to load applications')
    } finally {
      setLoading(false)
    }
  }, [nameFilter, groupFilter])
  
  // Fetch user role
  const fetchUserRole = async () => {
    try {
      const user = await getCurrentUser()
      
      if (!user) {
        window.location.href = '/login?redirectedFrom=/applications'
        return
      }
      
      const profile = await getUserProfile(user.id)
      
      if (!profile) {
        console.error('Profile not found')
        return
      }
      
      setUserRole(profile.role as Role)
      
      // Redirect if user doesn't have appropriate role
      const allowedRoles = [Role.Admin, Role.Staff, Role.Coordinator]
      if (!allowedRoles.includes(profile.role as Role)) {
        window.location.href = '/'
      }
    } catch (err) {
      console.error('Error fetching user role:', err)
    }
  }
  
  useEffect(() => {
    fetchUserRole()
    
    // Check if user is authenticated and has appropriate role
    const supabase = createClient()
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') {
        window.location.href = '/login'
      } else if (event === 'SIGNED_IN') {
        // Refresh user role when signed in
        fetchUserRole()
      }
    })

    // Fetch applications on initial load
    fetchApplications();

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchApplications])

  // Handle approve application
  const handleApprove = async (userId: string, role: Role) => {
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          role,
          action: 'approve'
        }),
      })
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }
      
      // Show success message
      toast.success('Application approved successfully')
      
      // Refresh applications list
      fetchApplications()
    } catch (err) {
      console.error('Error approving application:', err)
      setError('Failed to approve application')
      toast.error('Failed to approve application')
    }
  }
  
  // Handle reject application
  const handleReject = async (userId: string) => {
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action: 'reject'
        }),
      })
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }
      
      // Show success message
      toast.success('Application rejected successfully')
      
      // Refresh applications list
      fetchApplications()
    } catch (err) {
      console.error('Error rejecting application:', err)
      setError('Failed to reject application')
      toast.error('Failed to reject application')
    }
  }
  
  // Check if current user can approve this role
  const canApproveRole = (requestedRole: Role) => {
    if (!userRole) return false
    
    if (userRole === Role.Admin) return true
    if (userRole === Role.Staff && [Role.Coordinator, Role.Tutor, Role.Tutee].includes(requestedRole)) return true
    if (userRole === Role.Coordinator && [Role.Tutor, Role.Tutee].includes(requestedRole)) return true
    
    return false
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
  
  // Apply filters
  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault()
    fetchApplications()
  }

  // Show confirm dialog for approve
  const showApproveConfirm = (application: Application) => {
    setConfirmDialog({
      isOpen: true,
      action: 'approve',
      application,
      onConfirm: () => {
        handleApprove(application.id, application.apply_role as Role)
        setConfirmDialog(prev => ({ ...prev, isOpen: false }))
      },
      onCancel: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
    })
  }

  // Show confirm dialog for reject
  const showRejectConfirm = (application: Application) => {
    setConfirmDialog({
      isOpen: true,
      action: 'reject',
      application,
      onConfirm: () => {
        handleReject(application.id)
        setConfirmDialog(prev => ({ ...prev, isOpen: false }))
      },
      onCancel: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
    })
  }
  
  return (
    <div className={theme.layout.section.default}>
      <div className={theme.layout.container}>
        <div className="mb-8">
          <h1 className={theme.text.heading.h1}>Role Applications</h1>
          <p className={theme.text.body.base}>
            Review and approve role applications from users.
          </p>
        </div>
        
        {/* Filters */}
        <div className={`${theme.colors.background.secondary} rounded-lg p-4 mb-6`}>
          <form onSubmit={handleApplyFilters} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormInput
              id="nameFilter"
              name="nameFilter"
              type="text"
              label="Search by Name"
              value={nameFilter}
              onChange={handleFilterChange}
              placeholder="Enter name to search"
            />
            
            <FormSelect
              id="groupFilter"
              name="groupFilter"
              label="Filter by Role"
              value={groupFilter}
              onChange={handleFilterChange}
              options={[
                { value: '', label: 'All Roles' },
                ...Object.values(Role).map(role => ({
                  value: role,
                  label: role
                }))
              ]}
            />
            
            <div className="flex items-end">
              <button
                type="submit"
                className={`${theme.button.primary} w-full md:w-auto`}
                disabled={loading}
              >
                Apply Filters
              </button>
            </div>
          </form>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="bg-red-600 text-white p-4 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        {/* Applications list */}
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : applications.length === 0 ? (
            <div className={`${theme.colors.background.secondary} rounded-lg p-8 text-center`}>
              <p className={theme.text.body.large}>No applications found</p>
              <p className={theme.text.body.small}>Try adjusting your filters or check back later.</p>
            </div>
          ) : (
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className={theme.colors.background.secondary}>
                    <tr>
                      <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current Role
                      </th>
                      <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Requested Role
                      </th>
                      <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {applications.map((application) => (
                      <tr key={application.id} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {application.first_name} {application.last_name}
                          </div>
                          <div className="sm:hidden text-xs text-gray-500 mt-1">
                            {application.student_email}
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {application.student_email}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            application.role ? 'bg-green-500' : 'bg-yellow-500'
                          } text-white`}>
                            {application.role || 'None'}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-sky-500 text-white`}>
                            {application.apply_role}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          {canApproveRole(application.apply_role as Role) && (
                            <>
                              <button
                                onClick={() => showApproveConfirm(application)}
                                className="text-green-600 hover:text-green-900 bg-green-100 hover:bg-green-200 px-3 py-1 rounded-md"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => showRejectConfirm(application)}
                                className="text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 px-3 py-1 rounded-md"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      >
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {confirmDialog.action === 'approve' ? 'Approve Application' : 'Reject Application'}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {confirmDialog.action === 'approve' ? (
              <>
                Are you sure you want to approve the application for{' '}
                <span className="font-medium">{confirmDialog.application?.first_name} {confirmDialog.application?.last_name}</span>?
                Their role will be updated to {confirmDialog.application?.apply_role}.
              </>
            ) : (
              <>
                Are you sure you want to reject the application for{' '}
                <span className="font-medium">{confirmDialog.application?.first_name} {confirmDialog.application?.last_name}</span>?
              </>
            )}
          </p>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              onClick={confirmDialog.onCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                confirmDialog.action === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
              onClick={confirmDialog.onConfirm}
            >
              {confirmDialog.action === 'approve' ? 'Approve' : 'Reject'}
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  )
} 