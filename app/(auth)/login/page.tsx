'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { theme } from '@/app/styles/theme'

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
    <section className={theme.layout.section.default}>
      <div className={theme.layout.container}>
        <div className={`${theme.layout.maxWidth.sm} mx-auto`}>
          <div className={theme.layout.auth.card}>
            <h1 className={`${theme.text.heading.h2} ${theme.text.align.center} ${theme.spacing.section}`}>
              Sign In
            </h1>
            
            <form onSubmit={handleSubmit} className={theme.layout.auth.form}>
              <div className={theme.form.group}>
                <label htmlFor="email" className={theme.text.label}>
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={theme.input.base}
                  placeholder="Enter your email"
                />
              </div>

              <div className={`${theme.form.group} ${theme.form.spacing.section}`}>
                <label htmlFor="password" className={theme.text.label}>
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={theme.input.base}
                  placeholder="Enter your password"
                />
              </div>

              {error && (
                <div className={theme.text.error}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`${theme.button.primary.base} ${theme.button.primary.default} w-full mt-6 py-3 text-base font-medium ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
} 