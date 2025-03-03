'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { theme } from '@/app/styles/theme'
import { Role, Group } from '@/types/database/schema'

interface UserProfile {
  id: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  student_phone: string | null
  student_email: string | null
  parent_phone: string | null
  parent_email: string | null
  group: Group | null
  role: Role | null
  apply_role: Role | null
}

interface EditableField {
  name: keyof UserProfile;
  value: string | null | Role | Group;
  type: 'text' | 'email' | 'tel' | 'select';
  label: string;
  options?: (Role | Group)[];
}

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [editing, setEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<{
    id: string;
    email?: string;
  } | null>(null)

  const getEditableFields = (profile: UserProfile | null): EditableField[] => [
    { name: 'student_phone', value: profile?.student_phone || null, type: 'tel', label: 'Student Phone' },
    { name: 'student_email', value: profile?.student_email || null, type: 'email', label: 'Student Email' },
    { name: 'parent_phone', value: profile?.parent_phone || null, type: 'tel', label: 'Parent Phone' },
    { name: 'parent_email', value: profile?.parent_email || null, type: 'email', label: 'Parent Email' },
    { 
      name: 'apply_role', 
      value: profile?.apply_role || null, 
      type: 'select', 
      options: Object.values(Role),
      label: 'Apply Role'
    },
    { 
      name: 'group', 
      value: profile?.group || null, 
      type: 'select', 
      options: Object.values(Group),
      label: 'Group'
    }
  ]

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const checkSession = async () => {
      try {
        const { data: { user }, error: sessionError } = await supabase.auth.getUser()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          router.replace('/login?redirectedFrom=/profile')
          return
        }

        if (!user) {
          console.error('No user found')
          router.replace('/login?redirectedFrom=/profile')
          return
        }

        console.log('User found:', user.id)

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Error fetching profile:', profileError.message)
          console.error('Error details:', profileError)
          return
        }

        console.log('Profile data:', profileData)

        if (!profileData) {
          // If profile doesn't exist, create one
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([
              { 
                id: user.id,
                first_name: null,
                last_name: null,
                avatar_url: null,
                student_phone: null,
                student_email: user.email,
                parent_phone: null,
                parent_email: null,
                group: null,
                role: null,
                apply_role: null
              }
            ])
            .select()
            .single()

          if (createError) {
            console.error('Error creating profile:', createError)
            return
          }

          setProfile(newProfile)
        } else {
          setProfile(profileData)
        }

        setUser(user)
      } catch (error) {
        console.error('Unexpected error:', error)
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.replace('/login?redirectedFrom=/profile')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  useEffect(() => {
    if (profile) {
      setEditedProfile(profile)
    }
  }, [profile])

  const handleEdit = () => {
    setEditing(true)
  }

  const handleCancel = () => {
    setEditedProfile(profile)
    setEditing(false)
  }

  const handleChange = (name: keyof UserProfile, value: string) => {
    if (!editedProfile) return;
    
    let newValue: string | null | Role | Group = value;
    
    // Handle empty values
    if (value === '') {
      newValue = null;
    }
    // Handle Role and Group enums
    else if (name === 'apply_role' || name === 'role') {
      newValue = value as Role;
    }
    else if (name === 'group') {
      newValue = value as Group;
    }

    setEditedProfile({
      ...editedProfile,
      [name]: newValue
    });
  };

  const handleSave = async () => {
    if (!editedProfile || !user) {
      console.error('Cannot save: editedProfile or user is null');
      return;
    }
    
    setSaving(true);
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    try {
      // First check if we have a valid session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw sessionError;
      }

      if (!session) {
        console.error('No valid session found');
        router.replace('/login?redirectedFrom=/profile');
        return;
      }

      // Prepare profile data with proper type handling
      const profileData = {
        id: user.id,
        first_name: editedProfile.first_name,
        last_name: editedProfile.last_name,
        avatar_url: editedProfile.avatar_url,
        student_phone: editedProfile.student_phone || null,
        student_email: editedProfile.student_email || null,
        parent_phone: editedProfile.parent_phone || null,
        parent_email: editedProfile.parent_email || null,
        group: editedProfile.group || null,
        role: editedProfile.role,  // Don't modify role directly
        apply_role: editedProfile.apply_role || null,
        updated_at: new Date().toISOString()
      };

      console.log('Saving profile:', profileData);
      
      const { data, error } = await supabase
        .from('profiles')
        .upsert(profileData)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Save response:', data);
      
      // Refresh profile data
      const { data: updatedProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (fetchError) {
        console.error('Error fetching updated profile:', fetchError);
        throw fetchError;
      }
        
      if (updatedProfile) {
        setProfile(updatedProfile);
        console.log('Profile updated successfully:', updatedProfile);
      }
      
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      // Show error message to user
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={`${theme.layout.section.default} flex items-center justify-center min-h-[60vh]`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!profile || !editedProfile) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className={`${theme.header.wrapper} px-4 py-5 sm:px-6 flex justify-between items-center`}>
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Profile Information</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details and application.</p>
                </div>
                {!editing ? (
                  <button
                    onClick={handleEdit}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex space-x-4">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                {profile && (
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                    {getEditableFields(profile).map((field) => (
                      <div key={field.name} className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">{field.label}</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {editing ? (
                            field.type === 'select' ? (
                              <select
                                value={editedProfile?.[field.name]?.toString() || ''}
                                onChange={(e) => handleChange(field.name, e.target.value)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                              >
                                <option value="">Select {field.label}</option>
                                {field.options?.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type={field.type}
                                value={editedProfile?.[field.name]?.toString() || ''}
                                onChange={(e) => handleChange(field.name, e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                              />
                            )
                          ) : (
                            field.value || 'Not set'
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 