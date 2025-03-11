/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Group, Role } from '@/types/database/schema'
import { theme } from '@/app/styles/theme'
import FormInput from '@/app/components/forms/FormInput'
import FormSelect from '@/app/components/forms/FormSelect'
import { createClient, getCurrentUser, getUserProfile } from '@/lib/supabase'

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
  const [userRole, setUserRole] = useState<Role | null>(null)
  
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
        window.location.href = '/login'
        return
      }
      
      const profile = await getUserProfile(user.id)
      if (profile) {
        setUserRole(profile.role as Role)
      }
    } catch (error) {
      console.error('Error fetching user role:', error)
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
  
  // Wrap fetchTutorsWithParams in useCallback
  const fetchTutorsWithParams = useCallback(async (params: URLSearchParams) => {
    try {
      setLoadingTutors(true)
      const supabase = createClient()
      
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('role', Role.Tutor)
      
      const { data, error } = await query
      
      if (error) {
        console.error('Error fetching tutors:', error)
        return
      }
      
      // Process tutors to include tutee count
      const tutorsWithCount = await Promise.all(
        data.map(async (tutor) => {
          const { data: pairsData } = await supabase
            .from('pairs')
            .select('*')
            .eq('tutor_id', tutor.id)
          
          return {
            ...tutor,
            tutee_count: pairsData?.length || 0
          }
        })
      )
      
      // If there's a selected tutor, make sure they appear at the top of their respective group
      if (selectedTutor) {
        tutorsWithCount.sort((a, b) => {
          // If one of the tutors is the selected tutor, prioritize it
          if (a.id === selectedTutor.id) return -1
          if (b.id === selectedTutor.id) return 1
          
          // Otherwise, maintain the normal sorting by tutee count
          return a.tutee_count - b.tutee_count
        })
      } else {
        // Normal sorting by tutee count if no tutor is selected
        tutorsWithCount.sort((a, b) => a.tutee_count - b.tutee_count)
      }
      
      setTutors(tutorsWithCount)
    } catch (error) {
      console.error('Error fetching tutors:', error)
    } finally {
      setLoadingTutors(false)
    }
  }, [selectedTutor])
  
  // Wrap fetchTuteesWithParams in useCallback
  const fetchTuteesWithParams = useCallback(async (params: URLSearchParams) => {
    try {
      setLoadingTutees(true)
      const supabase = createClient()
      
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('role', Role.Tutee)
      
      // Get pairs to determine which tutees are already paired
      const { data: pairsData, error: pairsError } = await supabase
        .from('pairs')
        .select('tutee_id')
      
      if (pairsError) {
        console.error('Error fetching pairs:', pairsError)
        return
      }
      
      // Get all paired tutee IDs
      const pairedTuteeIds = pairsData.map(pair => pair.tutee_id)
      
      // Execute the query to get tutees
      const { data, error } = await query
      
      if (error) {
        console.error('Error fetching tutees:', error)
        return
      }
      
      // Filter out tutees that are already paired
      const unpaired = data.filter(tutee => !pairedTuteeIds.includes(tutee.id))
      
      setTutees(unpaired)
    } catch (error) {
      console.error('Error fetching tutees:', error)
    } finally {
      setLoadingTutees(false)
    }
  }, [])
  
  // Fetch tutors with filters
  const fetchTutors = useCallback(() => {
    fetchTutorsWithParams(new URLSearchParams())
  }, [fetchTutorsWithParams])
  
  // Fetch tutees with filters
  const fetchTutees = useCallback(() => {
    fetchTuteesWithParams(new URLSearchParams())
  }, [fetchTuteesWithParams])
  
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
      console.log('Fetched pairs data:', data.pairs || [])
      setPairs(data.pairs || [])
      return data.pairs || [];
    } catch (err) {
      console.error('Error fetching pairs:', err)
      setError('Failed to load pairs')
      return [];
    } finally {
      setLoadingTutors(false)
    }
  }, [])
  
  // Handle tutor selection
  const handleTutorSelect = (tutor: Tutor) => {
    console.log('Selected tutor:', tutor);
    setSelectedTutor(tutor);
    
    // When selecting a tutor, find all pairs with this tutor
    const tutorPairs = pairs.filter(pair => pair.tutor.id === tutor.id);
    console.log('Tutor pairs:', tutorPairs);
    const tuteeIds = tutorPairs.map(pair => pair.tutee.id);
    setSelectedTutees(tuteeIds);
    
    // Refresh pairs data to ensure we have the latest pairs
    fetchPairs();
    
    // Refresh tutees list to show only unpaired tutees
    fetchTutees();
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
    
    // Create the pair
    createPair(selectedTutor.id, tuteeId);
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
  
  // Initial data loading
  useEffect(() => {
    fetchUserRole()
  }, [])

  // Load data when user role is confirmed
  useEffect(() => {
    if ([Role.Admin, Role.Staff, Role.Coordinator].includes(userRole as Role)) {
      // First fetch pairs, then tutors and tutees
      fetchPairs().then(() => {
        fetchTutors();
        fetchTutees();
      });
    }
  }, [userRole, fetchPairs, fetchTutors, fetchTutees]);
  
  // Fetch tutees when selected tutor changes
  useEffect(() => {
    if (tuteeNameFilter || tuteeGroupFilter) {
      fetchTutees();
    }
  }, [tuteeNameFilter, tuteeGroupFilter, fetchTutees]);
  
  // Refresh pairs data when a tutor is selected
  useEffect(() => {
    if (selectedTutor) {
      fetchPairs();
    }
  }, [selectedTutor, fetchPairs]);
  
  return (
    <>
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
                  <div>
                    {/* Group tutors by whether they have tutees */}
                    {tutors.some(tutor => tutor.tutee_count === 0) && (
                      <div className="bg-green-100 px-4 py-2 text-sm font-medium text-green-800">
                        Available Tutors (No Tutees)
                      </div>
                    )}
                    
                    <ul className="divide-y divide-gray-200">
                      {/* First show tutors with no tutees */}
                      {tutors
                        .filter(tutor => tutor.tutee_count === 0)
                        .map((tutor) => {
                          return (
                            <li 
                              key={tutor.id}
                              className={`p-4 hover:bg-gray-50 cursor-pointer ${selectedTutor?.id === tutor.id ? 'bg-sky-50 border-l-4 border-sky-500' : ''} bg-green-50`}
                              onClick={() => handleTutorSelect(tutor)}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <h3 className="text-lg font-medium text-gray-900">
                                    {tutor.first_name} {tutor.last_name}
                                    <span className="ml-2 text-sm font-medium text-green-600">
                                      (Available)
                                    </span>
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
                                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                    0 tutees
                                  </span>
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      
                      {/* Then show tutors with tutees */}
                      {tutors.some(tutor => tutor.tutee_count > 0) && (
                        <div className="bg-yellow-100 px-4 py-2 text-sm font-medium text-yellow-800">
                          Tutors with Assigned Tutees
                        </div>
                      )}
                      
                      {tutors
                        .filter(tutor => tutor.tutee_count > 0)
                        .map((tutor) => {
                          // Find all pairs for this tutor
                          const tutorPairs = pairs.filter(pair => pair.tutor.id === tutor.id);
                          console.log(`Tutor ${tutor.first_name} ${tutor.last_name} pairs:`, tutorPairs);
                          
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
                                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                    {tutor.tutee_count} tutee{tutor.tutee_count !== 1 ? 's' : ''}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Show paired tutees if this tutor is selected */}
                              {selectedTutor?.id === tutor.id && (
                                <div className="mt-3 pl-4 border-l-2 border-sky-200">
                                  <p className="text-sm font-medium text-gray-700 mb-2">
                                    {tutorPairs.length > 0 ? 'Current Pairs:' : 'No tutees paired with this tutor yet.'}
                                  </p>
                                  {tutorPairs.length > 0 && (
                                    <ul className="space-y-2">
                                      {tutorPairs.map(pair => (
                                        <li key={pair.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                          <div>
                                            <span className="text-sm font-medium">
                                              {pair.tutee?.first_name || 'Unknown'} {pair.tutee?.last_name || ''}
                                            </span>
                                            {pair.tutee?.group && (
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
                                  )}
                                </div>
                              )}
                            </li>
                          );
                        })}
                    </ul>
                  </div>
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
                              </div>
                              <div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePairAction(tutee.id);
                                  }}
                                  className="px-3 py-1 rounded-md text-white text-sm font-medium bg-green-500 hover:bg-green-600"
                                >
                                  Add
                                </button>
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
    </>
  )
}