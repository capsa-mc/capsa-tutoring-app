'use client'

import { useState, useEffect, useCallback } from 'react'
import { Group, Role } from '@/types/database/schema'
import { theme } from '@/app/styles/theme'
import FormInput from '@/app/components/forms/FormInput'
import FormSelect from '@/app/components/forms/FormSelect'
import { createClient, getCurrentUser, getUserProfile } from '@/lib/supabase'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'

interface Profile {
  id: string
  first_name: string | null
  last_name: string | null
  student_email: string | null
  group: Group | null
  role: Role | null
  is_paired?: boolean
  tutor_id?: string | null
  paired_tutor?: {
    id: string
    name: string
  } | null
}

interface Tutor extends Profile {
  tutee_count: number
}

interface Pair {
  id: number
  tutor: Profile
  tutee: Profile
}

export default function PairsPage() {
  // State for tutors
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null)
  const [tutorNameFilter, setTutorNameFilter] = useState('')
  const [tutorGroupFilter, setTutorGroupFilter] = useState('')
  const [loadingTutors, setLoadingTutors] = useState(false)
  
  // State for tutees
  const [tutees, setTutees] = useState<Profile[]>([])
  const [selectedTutees, setSelectedTutees] = useState<string[]>([])
  const [tuteeNameFilter, setTuteeNameFilter] = useState('')
  const [tuteeGroupFilter, setTuteeGroupFilter] = useState('')
  const [loadingTutees, setLoadingTutees] = useState(false)
  
  // State for pairs
  const [pairs, setPairs] = useState<Pair[]>([])
  
  // State for errors
  const [error, setError] = useState<string | null>(null)
  
  // Fetch user role
  const fetchUserRole = async () => {
    try {
      const user = await getCurrentUser()
      
      if (!user) {
        window.location.href = '/login?redirectedFrom=/pairs'
        return
      }
      
      const profile = await getUserProfile(user.id)
      
      if (!profile) {
        console.error('Profile not found')
        return
      }
      
      // Redirect if user doesn't have appropriate role
      const allowedRoles = [Role.Admin, Role.Staff, Role.Coordinator]
      if (!allowedRoles.includes(profile.role as Role)) {
        window.location.href = '/'
      }
    } catch (err) {
      console.error('Error fetching user role:', err)
    }
  }
  
  // Handle filter changes
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    if (name === 'tutorNameFilter') {
      // Update state first, then fetch with the new value directly
      setTutorNameFilter(value)
      const params = new URLSearchParams()
      params.append('type', 'tutors')
      if (value) params.append('name', value)
      if (tutorGroupFilter) params.append('group', tutorGroupFilter)
      fetchTutorsWithParams(params)
    } else if (name === 'tutorGroupFilter') {
      // Update state first, then fetch with the new value directly
      setTutorGroupFilter(value)
      const params = new URLSearchParams()
      params.append('type', 'tutors')
      if (tutorNameFilter) params.append('name', tutorNameFilter)
      if (value) params.append('group', value)
      fetchTutorsWithParams(params)
    } else if (name === 'tuteeNameFilter') {
      // Update state first, then fetch with the new value directly
      setTuteeNameFilter(value)
      const params = new URLSearchParams()
      params.append('type', 'tutees')
      if (value) params.append('name', value)
      if (tuteeGroupFilter) params.append('group', tuteeGroupFilter)
      fetchTuteesWithParams(params)
    } else if (name === 'tuteeGroupFilter') {
      // Update state first, then fetch with the new value directly
      setTuteeGroupFilter(value)
      const params = new URLSearchParams()
      params.append('type', 'tutees')
      if (tuteeNameFilter) params.append('name', tuteeNameFilter)
      if (value) params.append('group', value)
      fetchTuteesWithParams(params)
    }
  }
  
  // Helper function to fetch tutors with specific params
  const fetchTutorsWithParams = async (params: URLSearchParams) => {
    setLoadingTutors(true)
    setError(null)
    
    try {
      // Fetch tutors from API
      const response = await fetch(`/api/pairs?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }
      
      const data = await response.json()
      const tutorsList: Tutor[] = data.tutors || []
      setTutors(tutorsList)
      
      // If a tutor is selected, keep the selection
      if (selectedTutor) {
        const updatedTutor = tutorsList.find(tutor => tutor.id === selectedTutor.id) || null
        setSelectedTutor(updatedTutor)
      }
    } catch (err) {
      console.error('Error fetching tutors:', err)
      setError('Failed to load tutors')
    } finally {
      setLoadingTutors(false)
    }
  }
  
  // Helper function to fetch tutees with specific params
  const fetchTuteesWithParams = async (params: URLSearchParams) => {
    if (!selectedTutor) {
      setTutees([])
      return
    }
    
    setLoadingTutees(true)
    setError(null)
    
    try {
      // Fetch tutees from API
      const response = await fetch(`/api/pairs?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }
      
      const data = await response.json()
      setTutees(data.tutees || [])
    } catch (err) {
      console.error('Error fetching tutees:', err)
      setError('Failed to load tutees')
    } finally {
      setLoadingTutees(false)
    }
  }
  
  // Fetch tutors
  const fetchTutors = useCallback(async () => {
    // Build query parameters
    const params = new URLSearchParams()
    params.append('type', 'tutors')
    if (tutorNameFilter) params.append('name', tutorNameFilter)
    if (tutorGroupFilter) params.append('group', tutorGroupFilter)
    
    fetchTutorsWithParams(params)
  }, [tutorNameFilter, tutorGroupFilter])
  
  // Fetch tutees
  const fetchTutees = useCallback(async () => {
    if (!selectedTutor) {
      setTutees([])
      return
    }
    
    // Build query parameters
    const params = new URLSearchParams()
    params.append('type', 'tutees')
    if (tuteeNameFilter) params.append('name', tuteeNameFilter)
    if (tuteeGroupFilter) params.append('group', tuteeGroupFilter)
    
    fetchTuteesWithParams(params)
  }, [selectedTutor, tuteeNameFilter, tuteeGroupFilter])
  
  // Fetch pairs
  const fetchPairs = useCallback(async () => {
    setLoadingTutors(true)
    setError(null)
    
    try {
      // Build query parameters
      const params = new URLSearchParams()
      params.append('type', 'pairs')
      
      // Fetch pairs from API
      const response = await fetch(`/api/pairs?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }
      
      const data = await response.json()
      setPairs(data.pairs || [])
    } catch (err) {
      console.error('Error fetching pairs:', err)
      setError('Failed to load pairs')
    } finally {
      setLoadingTutors(false)
    }
  }, [])
  
  // Handle tutor selection
  const handleTutorSelect = (tutor: Tutor) => {
    setSelectedTutor(tutor)
    setSelectedTutees([])
    
    // When selecting a tutor, find all pairs with this tutor
    const tutorPairs = pairs.filter(pair => pair.tutor.id === tutor.id);
    const tuteeIds = tutorPairs.map(pair => pair.tutee.id);
    setSelectedTutees(tuteeIds);
  }
  
  // Handle tutee selection
  const handleTuteeSelect = (tuteeId: string) => {
    // Toggle selection without creating/deleting pairs
    if (selectedTutees.includes(tuteeId)) {
      setSelectedTutees(prev => prev.filter(id => id !== tuteeId));
    } else {
      setSelectedTutees(prev => [...prev, tuteeId]);
    }
  }
  
  // Handle pair action
  const handlePairAction = (tuteeId: string) => {
    if (!selectedTutor) return;
    
    // Find the pair with this tutor and tutee
    const existingPair = pairs.find(
      pair => pair.tutor.id === selectedTutor.id && pair.tutee.id === tuteeId
    );
    
    if (existingPair) {
      // If pair exists, delete it
      handleDeletePair(existingPair.id);
    } else {
      // If pair doesn't exist, create it
      createPair(selectedTutor.id, tuteeId);
    }
  }
  
  // Create a single pair
  const createPair = async (tutorId: string, tuteeId: string) => {
    try {
      const response = await fetch('/api/pairs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tutorId,
          tuteeIds: [tuteeId],
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      // Refresh data - fetch pairs and tutors to update tutee count
      fetchPairs();
      fetchTutors();
    } catch (err) {
      console.error('Error creating pair:', err);
      setError('Failed to create pair');
    }
  }
  
  // Delete pair
  const handleDeletePair = async (pairId: number) => {
    try {
      const response = await fetch(`/api/pairs?id=${pairId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }
      
      // Refresh data - fetch pairs, tutors, and tutees
      fetchPairs();
      fetchTutors();
      fetchTutees();
    } catch (err) {
      console.error('Error deleting pair:', err)
      setError('Failed to delete pair')
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
    
    // Fetch initial data
    fetchTutors()
    fetchPairs()
    
    return () => {
      subscription.unsubscribe()
    }
  }, []) // Remove dependencies to prevent infinite loop
  
  // Fetch tutees when selected tutor changes
  useEffect(() => {
    fetchTutees()
  }, [selectedTutor, tuteeNameFilter, tuteeGroupFilter]) // Remove fetchTutees from dependencies
  
  return (
    <>
      <Header />
      <div className={theme.layout.section.default}>
        <div className={theme.layout.container}>
          {/* Error message */}
          {error && (
            <div className="bg-red-600 text-white p-4 rounded-lg mb-6">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Tutor Selection */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="p-4 bg-sky-500 text-white">
                <h2 className="text-xl font-semibold">Select a Tutor</h2>
              </div>
              
              {/* Tutor Filters */}
              <div className={`${theme.colors.background.secondary} p-4`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    id="tutorNameFilter"
                    name="tutorNameFilter"
                    type="text"
                    label="Search by Name"
                    value={tutorNameFilter}
                    onChange={handleFilterChange}
                    placeholder="Enter name to search"
                  />
                  
                  <FormSelect
                    id="tutorGroupFilter"
                    name="tutorGroupFilter"
                    label="Filter by Group"
                    value={tutorGroupFilter}
                    onChange={handleFilterChange}
                    options={[
                      { value: '', label: 'All Groups' },
                      ...Object.values(Group).map(group => ({
                        value: group,
                        label: group
                      }))
                    ]}
                  />
                </div>
              </div>
              
              {/* Tutors List */}
              <div className="overflow-y-auto max-h-96">
                {loadingTutors ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : tutors.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className={theme.text.body.large}>No tutors found</p>
                    <p className={theme.text.body.small}>Try adjusting your filters or check back later.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {tutors.map((tutor) => {
                      // Find all pairs for this tutor
                      const tutorPairs = pairs.filter(pair => pair.tutor.id === tutor.id);
                      
                      return (
                        <li 
                          key={tutor.id}
                          className={`p-4 hover:bg-gray-50 cursor-pointer ${selectedTutor?.id === tutor.id ? 'bg-sky-50 border-l-4 border-sky-500' : ''}`}
                          onClick={() => handleTutorSelect(tutor)}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">
                                {tutor.first_name} {tutor.last_name}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {tutor.student_email}
                              </p>
                              {tutor.group && (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  {tutor.group}
                                </span>
                              )}
                            </div>
                            <div className="text-right">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${tutor.tutee_count === 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {tutor.tutee_count} tutee{tutor.tutee_count !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                          
                          {/* Show paired tutees if this tutor is selected */}
                          {selectedTutor?.id === tutor.id && tutorPairs.length > 0 && (
                            <div className="mt-3 pl-4 border-l-2 border-sky-200">
                              <p className="text-sm font-medium text-gray-700 mb-2">Current Pairs:</p>
                              <ul className="space-y-2">
                                {tutorPairs.map(pair => (
                                  <li key={pair.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                    <div>
                                      <span className="text-sm font-medium">{pair.tutee.first_name} {pair.tutee.last_name}</span>
                                      {pair.tutee.group && (
                                        <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                          {pair.tutee.group}
                                        </span>
                                      )}
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeletePair(pair.id);
                                      }}
                                      className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md text-xs"
                                    >
                                      Delete
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
            
            {/* Tutee Selection */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="p-4 bg-sky-500 text-white">
                <h2 className="text-xl font-semibold">Select Tutees</h2>
                {selectedTutor && (
                  <p className="text-sm mt-1">
                    Pairing with: {selectedTutor.first_name} {selectedTutor.last_name}
                  </p>
                )}
              </div>
              
              {selectedTutor ? (
                <>
                  {/* Tutee Filters */}
                  <div className={`${theme.colors.background.secondary} p-4`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormInput
                        id="tuteeNameFilter"
                        name="tuteeNameFilter"
                        type="text"
                        label="Search by Name"
                        value={tuteeNameFilter}
                        onChange={handleFilterChange}
                        placeholder="Enter name to search"
                      />
                      
                      <FormSelect
                        id="tuteeGroupFilter"
                        name="tuteeGroupFilter"
                        label="Filter by Group"
                        value={tuteeGroupFilter}
                        onChange={handleFilterChange}
                        options={[
                          { value: '', label: 'All Groups' },
                          ...Object.values(Group).map(group => ({
                            value: group,
                            label: group
                          }))
                        ]}
                      />
                    </div>
                  </div>
                  
                  {/* Tutees List */}
                  <div className="overflow-y-auto max-h-96">
                    {loadingTutees ? (
                      <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                      </div>
                    ) : tutees.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className={theme.text.body.large}>No available tutees found</p>
                        <p className={theme.text.body.small}>Try adjusting your filters or check back later.</p>
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-200">
                        {tutees.map((tutee) => (
                          <li 
                            key={tutee.id}
                            className={`p-4 hover:bg-gray-50 cursor-pointer ${selectedTutees.includes(tutee.id) ? 'bg-sky-50 border-l-4 border-sky-500' : ''}`}
                            onClick={() => handleTuteeSelect(tutee.id)}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <h3 className="text-lg font-medium text-gray-900">
                                  {tutee.first_name} {tutee.last_name}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  {tutee.student_email}
                                </p>
                                {tutee.group && (
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                    {tutee.group}
                                  </span>
                                )}
                                {tutee.is_paired && tutee.paired_tutor && (
                                  <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                    Paired with: {tutee.paired_tutor.name}
                                  </span>
                                )}
                              </div>
                              <div>
                                {!tutee.is_paired && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePairAction(tutee.id);
                                    }}
                                    className="px-3 py-1 rounded-md text-white text-sm font-medium bg-green-500 hover:bg-green-600"
                                  >
                                    Add
                                  </button>
                                )}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              ) : (
                <div className="p-8 text-center">
                  <p className={theme.text.body.large}>Select a tutor first</p>
                  <p className={theme.text.body.small}>Choose a tutor from the left panel to see available tutees.</p>
                </div>
              )}
            </div>
          </div>          
        </div>
      </div>
      <Footer />
    </>
  )
}