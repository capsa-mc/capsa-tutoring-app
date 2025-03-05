'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AuthForm, FormInput } from '@/app/components'
import Link from 'next/link'

interface LoginFormData {
  email: string
  password: string
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectedFrom = searchParams.get('redirectedFrom') || '/profile'
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  })
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to sign in')
      } else if (result.data?.user) {
        router.refresh()
        router.push(redirectedFrom)
      }
    } catch (error) {
      console.error('Login error:', error)
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

  return (
    <AuthForm
      title="Sign In"
      error={error}
      onSubmit={handleSubmit}
      loading={loading}
      submitText="Sign In"
      loadingText="Signing In..."
    >
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

      <FormInput
        id="password"
        name="password"
        type="password"
        label="Password"
        value={formData.password}
        onChange={handleChange}
        required
        placeholder="Enter your password"
        minLength={8}
      />

      <div className="flex justify-between items-center mt-4">
        <div className="text-sm">
          <Link href="/forgot-password" className="text-sky-600 hover:text-sky-800">
            Forgot your password?
          </Link>
        </div>
        <div className="text-sm">
          <Link href="/register" className="text-sky-600 hover:text-sky-800">
            Create an account
          </Link>
        </div>
      </div>
    </AuthForm>
  )
} 