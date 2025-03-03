'use client'

import { useState } from 'react'
import { registerUser } from '@/lib/auth'
import { RegisterFormData } from '@/types/auth'
import { theme } from '@/app/styles/theme'
import { Role } from '@/types/database/schema'
import { supabase } from '@/lib/supabase'

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

  return (
    <section className={theme.layout.section.default}>
      <div className={theme.layout.container}>
        <div className={`${theme.layout.maxWidth.sm} mx-auto`}>
          <div className={theme.layout.auth.card}>
            <h1 className={`${theme.text.heading.h2} ${theme.text.align.center} ${theme.spacing.section}`}>
              Create Your Account
            </h1>
            
            {success ? (
              <div className="text-center">
                <div className={`${theme.text.heading.h3} ${theme.spacing.element} text-green-600`}>
                  Registration Successful!
                </div>
                <p className={`${theme.text.body.base} ${theme.spacing.element}`}>
                  Thank you for registering. Please check your email to verify your account.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={theme.layout.auth.form}>
                <div className={theme.layout.grid.form.row}>
                  <div className={theme.form.group}>
                    <label htmlFor="first_name" className={theme.text.label}>
                      First Name
                    </label>
                    <input
                      id="first_name"
                      name="first_name"
                      type="text"
                      required
                      value={formData.first_name}
                      onChange={handleChange}
                      className={theme.input.base}
                      placeholder="Enter first name"
                    />
                  </div>

                  <div className={theme.form.group}>
                    <label htmlFor="last_name" className={theme.text.label}>
                      Last Name
                    </label>
                    <input
                      id="last_name"
                      name="last_name"
                      type="text"
                      required
                      value={formData.last_name}
                      onChange={handleChange}
                      className={theme.input.base}
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                <div className={`${theme.layout.grid.form.row} ${theme.form.spacing.section}`}>
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

                  <div className={theme.form.group}>
                    <label htmlFor="apply_role" className={theme.text.label}>
                      I apply for
                    </label>
                    <select
                      id="apply_role"
                      name="apply_role"
                      value={formData.apply_role}
                      onChange={handleChange}
                      className={theme.input.select}
                      required
                    >
                      <option value={Role.Admin}>{Role.Admin}</option>
                      <option value={Role.Staff}>{Role.Staff}</option>
                      <option value={Role.Coordinator}>{Role.Coordinator}</option>
                      <option value={Role.Tutor}>{Role.Tutor}</option>
                      <option value={Role.Tutee}>{Role.Tutee}</option>
                    </select>
                  </div>
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
                    placeholder="Create a password (min. 8 characters)"
                    minLength={8}
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
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
} 