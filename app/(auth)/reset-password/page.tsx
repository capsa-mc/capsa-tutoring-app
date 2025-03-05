'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { AuthForm, FormInput } from '@/app/components'

interface ResetPasswordFormData {
  password: string
  confirmPassword: string
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<ResetPasswordFormData>({
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  // Check if we have a session with a valid access token
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getSession()
      
      // If no session or no access token, redirect to login
      if (!data.session?.access_token) {
        router.push('/login')
      }
    }
    
    checkSession()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        password: formData.password,
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
      }
    } catch (error) {
      console.error('Password update error:', error)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  if (success) {
    return (
      <AuthForm
        title="Password Reset Successful"
        error={error}
        onSubmit={(e) => {
          e.preventDefault()
          router.push('/login')
        }}
        loading={false}
        submitText="Sign In"
        loadingText=""
      >
        <div className="text-center">
          <p className="mb-4">
            Your password has been successfully reset. You can now sign in with your new password.
          </p>
        </div>
      </AuthForm>
    )
  }

  return (
    <AuthForm
      title="Reset Password"
      error={error}
      onSubmit={handleSubmit}
      loading={loading}
      submitText="Reset Password"
      loadingText="Resetting..."
    >
      <FormInput
        id="password"
        name="password"
        type="password"
        label="New Password"
        value={formData.password}
        onChange={handleChange}
        required
        placeholder="Enter new password"
        minLength={8}
      />

      <FormInput
        id="confirmPassword"
        name="confirmPassword"
        type="password"
        label="Confirm Password"
        value={formData.confirmPassword}
        onChange={handleChange}
        required
        placeholder="Confirm new password"
        minLength={8}
      />
    </AuthForm>
  )
} 