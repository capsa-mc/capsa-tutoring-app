import { supabase } from './supabase'
import { AuthResponse, RegisterFormData } from '@/types/auth'

export async function registerUser(formData: RegisterFormData): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          first_name: formData.first_name,
          last_name: formData.last_name,
          apply_role: formData.apply_role,
        },
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