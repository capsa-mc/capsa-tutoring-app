import { useState, useEffect } from 'react'
import { Role } from '@/types/database/schema'

interface SslFormDownloadProps {
  userRole: Role
  firstName: string | null
  lastName: string | null
}

interface SslRecord {
  name: string
  [key: string]: unknown
}

export default function SslFormDownload({ userRole, firstName, lastName }: SslFormDownloadProps) {
  const [sslData, setSslData] = useState<SslRecord[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkSslFiles = async () => {
      try {
        const response = await fetch('/api/ssl/bucket')
        const data = await response.json()
        if (data.exists) {
          const sslResponse = await fetch('/api/ssl/data')
          const sslJson = await sslResponse.json()
          setSslData(sslJson)
        }
      } catch (err) {
        console.error('Error checking SSL files:', err)
      }
    }

    checkSslFiles()
  }, [])

  const handleDownload = async () => {
    if (!firstName || !lastName) {
      setError('User name information is incomplete')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ssl/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName,
          lastName,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate SSL form')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ssl_form_${lastName}_${firstName}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate SSL form')
    } finally {
      setLoading(false)
    }
  }

  // Only show for Coordinator and Tutor roles
  if (userRole !== Role.Coordinator && userRole !== Role.Tutor) {
    return null
  }

  // Only show if we have SSL data
  if (!sslData) {
    return null
  }

  return (
    <div>
      <button
        onClick={handleDownload}
        disabled={loading}
        className="inline-flex items-center px-4 py-2 bg-sky-500 text-white text-sm font-medium rounded-md hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-sky-300 disabled:cursor-not-allowed transition-colors duration-200"
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating...
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download SSL Form
          </>
        )}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
} 