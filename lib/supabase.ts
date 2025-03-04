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
  if (!userId) return null
  
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('Error getting profile:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('Error in getUserProfile:', error)
    return null
  }
}