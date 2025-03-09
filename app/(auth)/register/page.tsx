'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { registerUser } from '@/lib/auth'
import { RegisterFormData } from '@/types/auth'
import { Role } from '@/types/database/schema'
import { supabase } from '@/lib/supabase'
import { AuthForm, FormInput, FormSelect } from '@/app/components'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    apply_role: Role.Tutee,
  })
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      const response = await registerUser(formData)
      if (response.success && response.data?.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: response.data.user.id,
            first_name: formData.first_name,
            last_name: formData.last_name,
            student_email: formData.email,
            apply_role: formData.apply_role,
          })

        if (profileError) {
          // Check if error is due to duplicate profile
          if (profileError.code === '23505') { // unique_violation
            await handleExistingEmail(formData.email)
          } else {
            console.error('Error creating profile:', profileError)
            setError('Registration successful but there was an issue creating your profile. Please contact support.')
          }
        } else {
          setSuccess(true)
          // Redirect to callback page with registration parameter
          router.push('/callback?registration=true')
          // Reset form
          setFormData({
            email: '',
            password: '',
            first_name: '',
            last_name: '',
            apply_role: Role.Tutee,
          })
        }
      } else {
        if (response.error?.message?.toLowerCase().includes('email already registered')) {
          // Check if the email is unverified and resend verification email
          const { error: resendError } = await supabase.auth.resend({
            type: 'signup',
            email: formData.email,
            options: {
              emailRedirectTo: `${window.location.origin}/callback?registration=true`,
            },
          })

          if (resendError?.message?.includes('Email already confirmed')) {
            setError('This email is already registered. Please try signing in instead.')
          } else {
            setSuccess(true)
            setError('')
          }
        } else {
          setError(response.error?.message || 'Registration failed')
        }
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleExistingEmail = async (email: string) => {
    try {
      // Try to resend verification email directly
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/callback?registration=true`,
        },
      })

      if (resendError?.message?.includes('Email already confirmed')) {
        setError('This email is already registered. Please try signing in instead.')
      } else {
        setSuccess(true)
        setError('')
      }
    } catch (error) {
      console.error('Error handling existing email:', error)
      setError('An unexpected error occurred. Please try again.')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleReturnHome = (e: React.FormEvent) => {
    e.preventDefault()
    router.push('/')
  }

  if (success) {
    return (
      <AuthForm
        title="Registration Successful!"
        error={error}
        onSubmit={handleReturnHome}
        loading={false}
        submitText="Return to Homepage"
        loadingText=""
      >
        <div className="text-center">
          <p className="mb-4">
            Thank you for registering. Please check your email to verify your account.
          </p>
          <p className="text-sm text-gray-600">
            If you don&apos;t receive the email within a few minutes, please check your spam folder.
            You can also try signing in to resend the verification email.
          </p>
        </div>
      </AuthForm>
    )
  }

  return (
    <AuthForm
      title="Create Your Account"
      error={error}
      onSubmit={handleSubmit}
      loading={loading}
      submitText="Create Account"
      loadingText="Creating Account..."
    >
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4`}>
        <FormInput
          id="first_name"
          name="first_name"
          type="text"
          label="First Name"
          value={formData.first_name}
          onChange={handleChange}
          required
          placeholder="Enter first name"
        />

        <FormInput
          id="last_name"
          name="last_name"
          type="text"
          label="Last Name"
          value={formData.last_name}
          onChange={handleChange}
          required
          placeholder="Enter last name"
        />
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 mt-4`}>
        <FormInput
          id="email"
          name="email"
          type="email"
          label="Email Address"
          value={formData.email}
          onChange={handleChange}
          required
          placeholder="Enter your email"
        />

        <FormSelect
          id="apply_role"
          name="apply_role"
          label="I apply for"
          value={formData.apply_role}
          onChange={handleChange}
          options={Object.values(Role).map(role => ({
            value: role,
            label: role
          }))}
          required
        />
      </div>

      <FormInput
        id="password"
        name="password"
        type="password"
        label="Password"
        value={formData.password}
        onChange={handleChange}
        required
        placeholder="Create a password (min. 8 characters)"
        minLength={8}
        className="mt-4"
      />
    </AuthForm>
  )
} 