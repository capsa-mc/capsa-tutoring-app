import { useState, useEffect, useCallback } from 'react'

interface UseFetchWithFiltersOptions {
  endpoint: string
  filters?: Record<string, string | number | boolean | null>
  enabled?: boolean
  onSuccess?: (data: unknown) => void
  onError?: (error: string) => void
}

interface UseFetchWithFiltersReturn<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useFetchWithFilters<T = unknown>({
  endpoint,
  filters = {},
  enabled = true,
  onSuccess,
  onError
}: UseFetchWithFiltersOptions): UseFetchWithFiltersReturn<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!enabled) return

    setLoading(true)
    setError(null)

    try {
      // Build query parameters
      const queryParams = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          queryParams.append(key, String(value))
        }
      })

      const url = `${endpoint}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      const response = await fetch(url)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      setData(result)
      
      if (onSuccess) {
        onSuccess(result)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching data'
      setError(errorMessage)
      
      if (onError) {
        onError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }, [endpoint, filters, enabled, onSuccess, onError])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refetch: fetchData
  }
}