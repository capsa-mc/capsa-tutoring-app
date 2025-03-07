import { supabase } from './supabase'
import { AuthResponse, RegisterFormData } from '@/types/auth'

export async function registerUser(formData: RegisterFormData): Promise<AuthResponse> {
  try {
    // Get the base URL for redirects
    const baseUrl = typeof window !== 'undefined' 
      ? `${window.location.protocol}//${window.location.host}`
      : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          first_name: formData.first_name,
          last_name: formData.last_name,
          apply_role: formData.apply_role,
        },
        emailRedirectTo: `${baseUrl}/callback?registration=true`,
      },
    })

    if (error) {
      return {
        success: false,
        error: {
          message: error.message,
          status: error.status,
        },
      }
    }

    return {
      success: true,
      data: {
        user: {
          id: data.user?.id || '',
          email: data.user?.email || '',
        },
        session: {
          access_token: data.session?.access_token || '',
          refresh_token: data.session?.refresh_token || '',
        },
      },
    }
  } catch {
    return {
      success: false,
      error: {
        message: 'An unexpected error occurred',
        status: 500,
      },
    }
  }
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut()
} 