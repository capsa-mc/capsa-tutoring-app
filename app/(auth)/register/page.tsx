'use client'

import { useState } from 'react'
import { registerUser } from '@/lib/auth'
import { RegisterFormData } from '@/types/auth'
import { Role } from '@/types/database/schema'
import { supabase } from '@/lib/supabase'
import { AuthForm, FormInput, FormSelect } from '@/app/components'

export default function RegisterPage() {
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
          console.error('Error creating profile:', profileError)
          setError('Registration successful but there was an issue creating your profile. Please contact support.')
        } else {
          setSuccess(true)
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
        setError(response.error?.message || 'Registration failed')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  if (success) {
    return (
      <AuthForm
        title="Registration Successful!"
        error={error}
        onSubmit={(e) => e.preventDefault()}
        loading={false}
        submitText="Return to Login"
        loadingText=""
      >
        <div className="text-center">
          <p className="mb-4">
            Thank you for registering. Please check your email to verify your account.
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