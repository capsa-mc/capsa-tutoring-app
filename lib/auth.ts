import { supabase } from './supabase'
import { AuthResponse, RegisterFormData } from '@/types/auth'
import { createClient, getCurrentUser, getUserProfile } from '@/lib/supabase';
import { Role } from '@/types/database/schema';

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

type AuthCallbacks = {
  onLoggedIn: (userRole: Role | null) => void;
  onLoggedOut: () => void;
  onLoading: (isLoading: boolean) => void;
};

export async function checkSession(callbacks: AuthCallbacks): Promise<void> {
  const { onLoggedOut, onLoading } = callbacks;

  onLoading(true);
  try {
    const user = await getCurrentUser();

    if (!user) {
      onLoggedOut();
      onLoading(false);
      return;
    }

    const profile = await getUserProfile(user.id);

    if (profile) {
      callbacks.onLoggedIn(profile.role as Role);
    } else {
      onLoggedOut();
    }
  } catch (error) {
    console.error('Error checking session:', error);
    onLoggedOut();
  } finally {
    onLoading(false);
  }
}

export async function initializeAuth(callbacks: AuthCallbacks): Promise<{ unsubscribe: () => void } | null> {
  const { onLoggedOut, onLoading } = callbacks;

  try {
    const supabase = createClient();

    const { data } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN') {
        await checkSession(callbacks);
      } else if (event === 'SIGNED_OUT') {
        onLoggedOut();
      }
    });

    await checkSession(callbacks);

    return data.subscription;
  } catch (error) {
    console.error('Error initializing auth:', error);
    onLoading(false);
    onLoggedOut();
    return null;
  }
} 