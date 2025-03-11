'use client'

import { useEffect, useState } from 'react'
import { createClient, getCurrentUser, getUserProfile } from '@/lib/supabase'
import { theme } from '@/app/styles/theme'
import { Role, Group } from '@/types/database/schema'
import MyTutoring from '@/app/components/MyTutoring'

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
  is_paired?: boolean
  tutor_id?: string | null
  paired_tutor?: {
    id: string
    name: string
    pair_id?: number
  } | null
  paired_tutees?: Array<{
    id: string
    name: string
    pair_id?: number
  }> | null
  tutee_count?: number
}

// Helper function to get role color
const getRoleColor = (role: Role | null): string => {
  if (!role) return 'bg-gray-400'; // Default color for no role
  
  switch (role) {
    case Role.Admin:
      return 'bg-purple-500';
    case Role.Staff:
      return 'bg-blue-500';
    case Role.Coordinator:
      return 'bg-green-500';
    case Role.Tutor:
      return 'bg-yellow-500';
    case Role.Tutee:
      return 'bg-sky-500';
    default:
      return 'bg-gray-400';
  }
};

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [editing, setEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<{
    id: string;
    email?: string;
  } | null>(null)

  useEffect(() => {
    const loadUserProfile = async () => {
      setLoading(true)
      
      try {
        // Get current user using the safer method
        const currentUser = await getCurrentUser()
        
        if (!currentUser) {
          window.location.href = '/login?redirectedFrom=/profile'
          return
        }
        
        setUser({
          id: currentUser.id,
          email: currentUser.email
        })
        
        // Get user profile
        const userProfile = await getUserProfile(currentUser.id)
        
        if (userProfile) {
          setProfile(userProfile as UserProfile)
          setEditedProfile(userProfile as UserProfile)
        } else {
          // Create a new profile if one doesn't exist
          const supabase = createClient()
          const { error: createError } = await supabase
            .from('profiles')
            .insert({
              id: currentUser.id,
              first_name: null,
              last_name: null,
              role: Role.Tutee // Default role
            })
            
          if (createError) {
            console.error('Error creating profile:', createError)
            return
          }
          
          // Fetch the newly created profile
          const newProfile = await getUserProfile(currentUser.id)
          if (newProfile) {
            setProfile(newProfile as UserProfile)
            setEditedProfile(newProfile as UserProfile)
          }
        }
      } catch (error) {
        console.error('Unexpected error:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadUserProfile()
  }, [])
  
  const handleEdit = () => {
    setEditing(true)
  }
  
  const handleSave = async () => {
    if (!editedProfile || !user) {
      console.error('Cannot save: editedProfile or user is null');
      return;
    }
    
    setSaving(true);
    
    try {
      const supabase = createClient();
      
      const profileData = {
        id: user.id,
        first_name: editedProfile.first_name || null,
        last_name: editedProfile.last_name || null,
        avatar_url: editedProfile.avatar_url || null,
        student_phone: editedProfile.student_phone || null,
        student_email: editedProfile.student_email || null,
        parent_phone: editedProfile.parent_phone || null,
        parent_email: editedProfile.parent_email || null,
        group: editedProfile.group || null,
        role: editedProfile.role,  // Don't modify role directly
        apply_role: editedProfile.apply_role || null
      };
      
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert(profileData)
        .select();

      if (updateError) {
        console.error('Supabase error:', updateError);
        throw updateError;
      }
      
      // Refresh profile data
      const updatedProfile = await getUserProfile(user.id)
        
      if (updatedProfile) {
        setProfile(updatedProfile as UserProfile);
        setEditedProfile(updatedProfile as UserProfile);
      }
      
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };
  
  const handleCancel = () => {
    setEditedProfile(profile)
    setEditing(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!editedProfile) return;
    
    const { name, value } = e.target;
    setEditedProfile({
      ...editedProfile,
      [name]: value
    });
  };

  if (loading) {
    return (
      <div className={theme.layout.section.default}>
        <div className={theme.layout.container}>
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className={theme.layout.section.default}>
        <div className={theme.layout.container}>
          <div className="text-center">
            <h1 className={theme.text.heading.h2}>Profile Not Found</h1>
            <p className={theme.text.body.base}>
              We couldn&apos;t find your profile. Please try logging in again.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={theme.layout.section.default}>
      <div className={theme.layout.container}>
        <div className="max-w-5xl mx-auto">
          {/* My Profile Box */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                  <h1 className={theme.text.heading.h2}>My Profile</h1>
                  <span className={`ml-3 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(profile.role as Role)} text-white`}>
                    {profile.role || 'None'}
                  </span>
                </div>
                <div>
                  {editing ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleCancel}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        disabled={saving}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600"
                        disabled={saving}
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleEdit}
                      className="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>

              {/* Profile Form */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                    {editing ? (
                      <input
                        type="text"
                        name="first_name"
                        value={editedProfile?.first_name || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-sky-500 focus:ring-sky-500"
                      />
                    ) : (
                      <p className="mt-1 text-gray-900">{profile.first_name || '-'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                    {editing ? (
                      <input
                        type="text"
                        name="last_name"
                        value={editedProfile?.last_name || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-sky-500 focus:ring-sky-500"
                      />
                    ) : (
                      <p className="mt-1 text-gray-900">{profile.last_name || '-'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Student Phone</label>
                    {editing ? (
                      <input
                        type="tel"
                        name="student_phone"
                        value={editedProfile?.student_phone || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-sky-500 focus:ring-sky-500"
                      />
                    ) : (
                      <p className="mt-1 text-gray-900">{profile.student_phone || '-'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Student Email</label>
                    {editing ? (
                      <input
                        type="email"
                        name="student_email"
                        value={editedProfile?.student_email || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-sky-500 focus:ring-sky-500"
                      />
                    ) : (
                      <p className="mt-1 text-gray-900">{profile.student_email || '-'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Parent Phone</label>
                    {editing ? (
                      <input
                        type="tel"
                        name="parent_phone"
                        value={editedProfile?.parent_phone || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-sky-500 focus:ring-sky-500"
                      />
                    ) : (
                      <p className="mt-1 text-gray-900">{profile.parent_phone || '-'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Parent Email</label>
                    {editing ? (
                      <input
                        type="email"
                        name="parent_email"
                        value={editedProfile?.parent_email || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-sky-500 focus:ring-sky-500"
                      />
                    ) : (
                      <p className="mt-1 text-gray-900">{profile.parent_email || '-'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Apply for Role</label>
                    {editing ? (
                      <select
                        name="apply_role"
                        value={editedProfile?.apply_role || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-sky-500 focus:ring-sky-500"
                      >
                        <option value="">Select a role</option>
                        {Object.values(Role).map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="mt-1 text-gray-900">
                        {profile.apply_role ? (
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(profile.apply_role as Role)} text-white`}>
                            {profile.apply_role}
                          </span>
                        ) : (
                          '-'
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Show MyTutoring for Tutor, Tutee, and Coordinator roles */}
          {profile.role && [Role.Tutor, Role.Tutee, Role.Coordinator].includes(profile.role) && (
            <MyTutoring
              userId={profile.id}
              userRole={profile.role}
              tutorInfo={profile.paired_tutor}
              tuteeInfo={profile.paired_tutees}
            />
          )}
        </div>
      </div>
    </div>
  )
}