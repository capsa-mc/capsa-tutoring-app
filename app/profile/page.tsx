'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { theme } from '@/app/styles/theme'
import { Role, Group } from '@/types/database/schema'

const formatPhoneNumber = (phoneNumber: string | null): string => {
  if (!phoneNumber) return 'Not set';
  const cleaned = phoneNumber.replace(/\D/g, '');
  if (cleaned.length !== 10) return phoneNumber;
  return `(${cleaned.slice(0, 3)})${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
};

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
        apply_role: editedProfile.apply_role || null
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
      <div className={`${theme.layout.section.default} flex items-center justify-center h-[calc(100vh-8rem)]`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
      </div>
    )
  }

  if (!profile || !editedProfile) {
    return null
  }

  return (
    <div className={`${theme.colors.background.secondary}`}>
      <div className="max-w-5xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div className="space-y-3">
          <div className={`${theme.colors.background.primary} shadow-lg rounded-2xl overflow-hidden`}>
            {/* Profile Header */}
            <div className="relative h-28 bg-gradient-to-r from-sky-500 to-sky-700">
              <div className="absolute -bottom-10 left-8">
                <div className={`w-20 h-20 rounded-full ${theme.colors.background.primary} shadow-md flex items-center justify-center overflow-hidden border-4 ${theme.colors.border.light}`}>
                  <span className={`text-3xl ${theme.colors.text.secondary}`}>
                    {profile?.first_name?.[0]?.toUpperCase() || profile?.student_email?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
              </div>
              <div className="absolute top-4 right-4">
                {!editing ? (
                  <button
                    onClick={handleEdit}
                    className={`px-4 py-2 ${theme.colors.background.primary} text-sky-500 hover:bg-sky-50 rounded-lg transition-colors shadow-sm`}
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="space-x-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className={`px-4 py-2 bg-sky-500 text-white hover:bg-sky-600 rounded-lg transition-colors shadow-sm disabled:opacity-50`}
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className={`px-4 py-2 ${theme.colors.background.primary} text-sky-500 hover:bg-sky-50 rounded-lg transition-colors shadow-sm disabled:opacity-50`}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Content */}
            <div className="px-8 pt-14 pb-6">
              <h1 className={`text-2xl font-bold ${theme.colors.text.primary} mb-1`}>
                {profile.first_name && profile.last_name 
                  ? `${profile.first_name} ${profile.last_name}`
                  : 'Name not set'}
              </h1>
              <p className={`${theme.colors.text.secondary} mb-6`}>{profile.student_email}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Role Information */}
                <div className="space-y-3">
                  <div className={`${theme.colors.background.secondary} rounded-lg p-4`}>
                    <h2 className={`text-sm font-medium ${theme.colors.text.secondary} uppercase tracking-wider mb-2`}>
                      Current Role
                    </h2>
                    <p className={`${theme.colors.text.primary} font-medium`}>
                      {profile.role || 'Not assigned'}
                    </p>
                  </div>

                  <div className={`${theme.colors.background.secondary} rounded-lg p-4`}>
                    <h2 className={`text-sm font-medium ${theme.colors.text.secondary} uppercase tracking-wider mb-2`}>
                      Applied Role
                    </h2>
                    {editing ? (
                      <select
                        value={String(editedProfile.apply_role ?? '')}
                        onChange={(e) => handleChange('apply_role', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
                      >
                        <option value="">Select Role</option>
                        {Object.values(Role).map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className={`${theme.colors.text.primary} font-medium`}>
                        {profile.apply_role || 'None'}
                      </p>
                    )}
                  </div>

                  <div className={`${theme.colors.background.secondary} rounded-lg p-4`}>
                    <h2 className={`text-sm font-medium ${theme.colors.text.secondary} uppercase tracking-wider mb-2`}>
                      Group
                    </h2>
                    {editing ? (
                      <select
                        value={String(editedProfile.group ?? '')}
                        onChange={(e) => handleChange('group', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
                      >
                        <option value="">Select Group</option>
                        {Object.values(Group).map((group) => (
                          <option key={group} value={group}>
                            {group}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className={`${theme.colors.text.primary} font-medium`}>
                        {profile.group || 'Not assigned'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-3">
                  <div className={`${theme.colors.background.secondary} rounded-lg p-4`}>
                    <h2 className={`text-sm font-medium ${theme.colors.text.secondary} uppercase tracking-wider mb-2`}>
                      Student Contact
                    </h2>
                    <div className="space-y-3">
                      <div>
                        <label className={`block text-sm ${theme.colors.text.secondary} mb-1`}>Email</label>
                        {editing ? (
                          <input
                            type="email"
                            value={String(editedProfile.student_email ?? '')}
                            onChange={(e) => handleChange('student_email', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
                          />
                        ) : (
                          <p className={theme.colors.text.primary}>
                            {profile.student_email || 'Not set'}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className={`block text-sm ${theme.colors.text.secondary} mb-1`}>Phone</label>
                        {editing ? (
                          <input
                            type="tel"
                            value={String(editedProfile.student_phone ?? '')}
                            onChange={(e) => handleChange('student_phone', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
                          />
                        ) : (
                          <p className={theme.colors.text.primary}>
                            {formatPhoneNumber(profile.student_phone)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={`${theme.colors.background.secondary} rounded-lg p-4`}>
                    <h2 className={`text-sm font-medium ${theme.colors.text.secondary} uppercase tracking-wider mb-2`}>
                      Parent Contact
                    </h2>
                    <div className="space-y-3">
                      <div>
                        <label className={`block text-sm ${theme.colors.text.secondary} mb-1`}>Email</label>
                        {editing ? (
                          <input
                            type="email"
                            value={String(editedProfile.parent_email ?? '')}
                            onChange={(e) => handleChange('parent_email', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
                          />
                        ) : (
                          <p className={theme.colors.text.primary}>
                            {profile.parent_email || 'Not set'}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className={`block text-sm ${theme.colors.text.secondary} mb-1`}>Phone</label>
                        {editing ? (
                          <input
                            type="tel"
                            value={String(editedProfile.parent_phone ?? '')}
                            onChange={(e) => handleChange('parent_phone', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
                          />
                        ) : (
                          <p className={theme.colors.text.primary}>
                            {formatPhoneNumber(profile.parent_phone)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}