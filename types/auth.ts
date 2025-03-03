import { Role } from './database/schema'

export interface RegisterFormData {
  email: string
  password: string
  first_name: string
  last_name: string
  apply_role: Role
}

export interface AuthError {
  message: string
  status?: number
}

export interface AuthResponse {
  success: boolean
  error?: AuthError
  data?: {
    user?: {
      id: string
      email: string
    }
    session?: {
      access_token: string
      refresh_token: string
    }
  }
} 