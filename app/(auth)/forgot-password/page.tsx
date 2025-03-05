'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { AuthForm, FormInput } from '@/app/components'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
      }
    } catch (error) {
      console.error('Password reset error:', error)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
  }

  if (success) {
    return (
      <AuthForm
        title="Check Your Email"
        error={error}
        onSubmit={(e) => {
          e.preventDefault()
          router.push('/login')
        }}
        loading={false}
        submitText="Return to Login"
        loadingText=""
      >
        <div className="text-center">
          <p className="mb-4">
            We&apos;ve sent a password reset link to your email. Please check your inbox and follow the instructions to reset your password.
          </p>
        </div>
      </AuthForm>
    )
  }

  return (
    <AuthForm
      title="Forgot Password"
      error={error}
      onSubmit={handleSubmit}
      loading={loading}
      submitText="Send Reset Link"
      loadingText="Sending..."
    >
      <FormInput
        id="email"
        name="email"
        type="email"
        label="Email Address"
        value={email}
        onChange={handleChange}
        required
        placeholder="Enter your email"
      />

      <div className="mt-4 text-center">
        <Link href="/login" className="text-sky-600 hover:text-sky-800 text-sm">
          Remember your password? Sign in
        </Link>
      </div>
    </AuthForm>
  )
} 