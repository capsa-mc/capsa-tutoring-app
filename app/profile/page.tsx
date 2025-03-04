'use client'

import { useEffect, useState } from 'react'
import { createClient, getCurrentUser, getUserProfile } from '@/lib/supabase'
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
              
              {editing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        id="first_name"
                        name="first_name"
                        value={editedProfile?.first_name || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        id="last_name"
                        name="last_name"
                        value={editedProfile?.last_name || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="student_phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Student Phone
                      </label>
                      <input
                        type="tel"
                        id="student_phone"
                        name="student_phone"
                        value={editedProfile?.student_phone || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="student_email" className="block text-sm font-medium text-gray-700 mb-1">
                        Student Email
                      </label>
                      <input
                        type="email"
                        id="student_email"
                        name="student_email"
                        value={editedProfile?.student_email || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="parent_phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Parent Phone
                      </label>
                      <input
                        type="tel"
                        id="parent_phone"
                        name="parent_phone"
                        value={editedProfile?.parent_phone || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="parent_email" className="block text-sm font-medium text-gray-700 mb-1">
                        Parent Email
                      </label>
                      <input
                        type="email"
                        id="parent_email"
                        name="parent_email"
                        value={editedProfile?.parent_email || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="apply_role" className="block text-sm font-medium text-gray-700 mb-1">
                        Apply for Role
                      </label>
                      <select
                        id="apply_role"
                        name="apply_role"
                        value={editedProfile?.apply_role || ''}
                        onChange={(e) => {
                          if (!editedProfile) return;
                          setEditedProfile({
                            ...editedProfile,
                            apply_role: e.target.value as Role || null
                          });
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
                      >
                        <option value="">Select a role</option>
                        <option value={Role.Tutor}>Tutor</option>
                        <option value={Role.Tutee}>Tutee</option>
                        <option value={Role.Coordinator}>Coordinator</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-3">
                    <div className={`${theme.colors.background.secondary} rounded-lg p-4`}>
                      <h2 className={`text-sm font-medium ${theme.colors.text.secondary} uppercase tracking-wider mb-2`}>
                        Name
                      </h2>
                      <p className={`${theme.colors.text.primary} font-medium`}>
                        {profile.first_name && profile.last_name 
                          ? `${profile.first_name} ${profile.last_name}`
                          : 'Not set'}
                      </p>
                    </div>
                    
                    <div className={`${theme.colors.background.secondary} rounded-lg p-4`}>
                      <h2 className={`text-sm font-medium ${theme.colors.text.secondary} uppercase tracking-wider mb-2`}>
                        Email
                      </h2>
                      <p className={`${theme.colors.text.primary} font-medium`}>
                        {user?.email || 'Not set'}
                      </p>
                    </div>
                    
                    <div className={`${theme.colors.background.secondary} rounded-lg p-4`}>
                      <h2 className={`text-sm font-medium ${theme.colors.text.secondary} uppercase tracking-wider mb-2`}>
                        Role
                      </h2>
                      <p className={`${theme.colors.text.primary} font-medium`}>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(profile.role as Role)} text-white`}>
                          {profile.role || 'Not assigned'}
                        </span>
                      </p>
                    </div>
                    
                    <div className={`${theme.colors.background.secondary} rounded-lg p-4`}>
                      <h2 className={`text-sm font-medium ${theme.colors.text.secondary} uppercase tracking-wider mb-2`}>
                        Apply Role
                      </h2>
                      <p className={`${theme.colors.text.primary} font-medium`}>
                        {profile.apply_role ? (
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-sky-500 text-white`}>
                            {profile.apply_role}
                          </span>
                        ) : 'Not applied'}
                      </p>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-3">
                    <div className={`${theme.colors.background.secondary} rounded-lg p-4`}>
                      <h2 className={`text-sm font-medium ${theme.colors.text.secondary} uppercase tracking-wider mb-2`}>
                        Student Phone
                      </h2>
                      <p className={`${theme.colors.text.primary} font-medium`}>
                        {profile.student_phone || 'Not set'}
                      </p>
                    </div>
                    
                    <div className={`${theme.colors.background.secondary} rounded-lg p-4`}>
                      <h2 className={`text-sm font-medium ${theme.colors.text.secondary} uppercase tracking-wider mb-2`}>
                        Student Email
                      </h2>
                      <p className={`${theme.colors.text.primary} font-medium`}>
                        {profile.student_email || 'Not set'}
                      </p>
                    </div>
                    
                    <div className={`${theme.colors.background.secondary} rounded-lg p-4`}>
                      <h2 className={`text-sm font-medium ${theme.colors.text.secondary} uppercase tracking-wider mb-2`}>
                        Parent Phone
                      </h2>
                      <p className={`${theme.colors.text.primary} font-medium`}>
                        {profile.parent_phone || 'Not set'}
                      </p>
                    </div>
                    
                    <div className={`${theme.colors.background.secondary} rounded-lg p-4`}>
                      <h2 className={`text-sm font-medium ${theme.colors.text.secondary} uppercase tracking-wider mb-2`}>
                        Parent Email
                      </h2>
                      <p className={`${theme.colors.text.primary} font-medium`}>
                        {profile.parent_email || 'Not set'}
                      </p>
                    </div>
                  </div>

                  {/* Group Information */}
                  <div className="space-y-3">
                    <div className={`${theme.colors.background.secondary} rounded-lg p-4`}>
                      <h2 className={`text-sm font-medium ${theme.colors.text.secondary} uppercase tracking-wider mb-2`}>
                        Group
                      </h2>
                      <p className={`${theme.colors.text.primary} font-medium`}>
                        {profile.group || 'Not assigned'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}