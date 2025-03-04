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
    <section className={`${theme.layout.section.default} min-h-[calc(100vh-8rem)] bg-gradient-to-b from-sky-50/50 to-white/50`}>
      <div className={theme.layout.container}>
        <div className={`${theme.layout.maxWidth.sm} mx-auto`}>
          <div className={theme.layout.auth.card}>
            <h1 className={`${theme.text.gradient.title} text-3xl text-center mb-8`}>
              {title}
            </h1>
            
            <form onSubmit={onSubmit} className={theme.layout.auth.form}>
              {children}

              {error && (
                <div className={`${theme.text.error} text-center bg-red-50 p-3 rounded-lg`}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`${theme.button.primary.base} ${theme.button.primary.default} w-full mt-8 ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
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