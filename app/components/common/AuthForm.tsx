'use client'

import { theme } from '@/app/styles/theme'

interface AuthFormProps {
  title: string
  children: React.ReactNode
  error?: string
  onSubmit: (e: React.FormEvent) => void
  loading?: boolean
  submitText: string
  loadingText: string
}

export default function AuthForm({
  title,
  children,
  error,
  onSubmit,
  loading = false,
  submitText,
  loadingText
}: AuthFormProps) {
  return (
    <section className={theme.layout.section.default}>
      <div className={theme.layout.container}>
        <div className={`${theme.layout.maxWidth.sm} mx-auto`}>
          <div className={theme.layout.auth.card}>
            <h1 className={`${theme.text.heading.h2} ${theme.text.align.center} ${theme.spacing.section}`}>
              {title}
            </h1>
            
            <form onSubmit={onSubmit} className={theme.layout.auth.form}>
              {children}

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
                {loading ? loadingText : submitText}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
} 