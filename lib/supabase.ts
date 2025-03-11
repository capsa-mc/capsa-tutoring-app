import { createBrowserClient } from '@supabase/ssr'

// Create a single instance of the Supabase client for browser usage
export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// For backwards compatibility with existing code
// This is a singleton instance that can be imported directly
export const supabase = createClient()

// Helper function to safely get the current user
export const getCurrentUser = async () => {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      // Check if this is an auth session missing error (user not logged in)
      if (error.message.includes('Auth session missing') || error.message.includes('Invalid JWT')) {
        // This is expected for non-logged in users, don't log as error
        return null
      }
      
      console.error('Error getting user:', error)
      return null
    }
    
    return user
  } catch (error) {
    // Check if this is an auth session missing error (user not logged in)
    if (error instanceof Error && 
        (error.message.includes('Auth session missing') || error.message.includes('Invalid JWT'))) {
      // This is expected for non-logged in users, don't log as error
      return null
    }
    
    console.error('Error in getCurrentUser:', error)
    return null
  }
}

// Helper function to safely get the current session
export const getCurrentSession = async () => {
  try {
    const supabase = createClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      // Check if this is an auth session missing error (user not logged in)
      if (error.message.includes('Auth session missing') || error.message.includes('Invalid JWT')) {
        // This is expected for non-logged in users, don't log as error
        return null
      }
      
      console.error('Error getting session:', error)
      return null
    }
    
    return session
  } catch (error) {
    // Check if this is an auth session missing error (user not logged in)
    if (error instanceof Error && 
        (error.message.includes('Auth session missing') || error.message.includes('Invalid JWT'))) {
      // This is expected for non-logged in users, don't log as error
      return null
    }
    
    console.error('Error in getCurrentSession:', error)
    return null
  }
}

// Helper function to safely get the user profile
export const getUserProfile = async (userId: string | undefined) => {
  if (!userId) {
    console.log('No userId provided to getUserProfile')
    return null
  }
  
  try {
    const supabase = createClient()
    
    // First get the basic profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) {
      // Log the specific error details
      console.error('Error getting profile:', {
        error,
        userId,
        message: error.message,
        code: error.code,
        details: error.details
      })
      
      // If the error is due to no profile found, create a basic profile
      if (error.code === 'PGRST116') {
        console.log('Profile not found, creating basic profile')
        const { data: user } = await supabase.auth.getUser()
        if (user) {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([{
              id: userId,
              role: 'Tutee', // Default role
              email_verified: false
            }])
            .select()
            .single()
            
          if (createError) {
            console.error('Error creating profile:', createError)
            return null
          }
          
          return newProfile
        }
      }
      return null
    }
    
    console.log('Profile fetched:', profile)
    
    // If profile exists, check for pairing information based on role
    if (profile) {
      // For tutors, get their paired tutees
      if (profile.role === 'Tutor') {
        console.log('Processing tutor profile')
        const { data: pairData, error: pairError } = await supabase
          .from('pairs')
          .select('id, tutee_id')
          .eq('tutor_id', userId)
        
        if (pairError) {
          console.error('Error fetching tutor pairs:', pairError)
        }
        
        console.log('Tutor pairs data:', pairData)
        
        if (!pairError && pairData) {
          // Get tutee details if there are pairs
          if (pairData.length > 0) {
            const tuteeIds = pairData.map(pair => pair.tutee_id)
            
            const { data: tutees, error: tuteesError } = await supabase
              .from('profiles')
              .select('id, first_name, last_name')
              .in('id', tuteeIds)
            
            if (tuteesError) {
              console.error('Error fetching tutees:', tuteesError)
            }
            
            console.log('Tutees data:', tutees)
            
            if (!tuteesError && tutees) {
              // Add paired tutees to the profile
              return {
                ...profile,
                paired_tutees: tutees.map(tutee => ({
                  id: tutee.id,
                  name: `${tutee.first_name || ''} ${tutee.last_name || ''}`.trim(),
                  pair_id: pairData.find(p => p.tutee_id === tutee.id)?.id
                })),
                tutee_count: tutees.length
              }
            }
          }
          
          // No tutees found
          return {
            ...profile,
            paired_tutees: [],
            tutee_count: 0
          }
        }
      }
      
      // For tutees, get their paired tutor
      if (profile.role === 'Tutee') {
        console.log('Processing tutee profile')
        const { data: pairData, error: pairError } = await supabase
          .from('pairs')
          .select('id, tutor_id')
          .eq('tutee_id', userId)
          .single()
        
        if (pairError) {
          console.error('Error fetching tutee pair:', pairError)
        }
        
        console.log('Tutee pair data:', pairData)
        
        if (!pairError && pairData) {
          // Get tutor details
          const { data: tutor, error: tutorError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .eq('id', pairData.tutor_id)
            .single()
          
          if (tutorError) {
            console.error('Error fetching tutor:', tutorError)
          }
          
          console.log('Tutor data:', tutor)
          
          if (!tutorError && tutor) {
            // Add paired tutor to the profile
            return {
              ...profile,
              is_paired: true,
              tutor_id: tutor.id,
              paired_tutor: {
                id: tutor.id,
                name: `${tutor.first_name || ''} ${tutor.last_name || ''}`.trim(),
                pair_id: pairData.id
              }
            }
          }
        }
        
        // No tutor found
        return {
          ...profile,
          is_paired: false,
          tutor_id: null,
          paired_tutor: null
        }
      }
    }
    
    return profile
  } catch (error) {
    console.error('Error in getUserProfile:', error)
    return null
  }
}