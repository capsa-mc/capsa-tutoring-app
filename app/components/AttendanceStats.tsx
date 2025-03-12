import { useEffect, useState } from 'react'

interface AttendanceStats {
  present: number
  excused: number
  absent: number
}

interface AttendanceStatsProps {
  userId: string
}

export default function AttendanceStats({ userId }: AttendanceStatsProps) {
  const [stats, setStats] = useState<AttendanceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/attendances/stats?userId=${userId}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch attendance stats')
        }

        setStats(data.stats)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        console.error('Error fetching attendance stats:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [userId])

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-sky-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-600 text-sm">
        Failed to load attendance statistics
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className="mb-6">
      <h3 className="font-medium mb-3">Attendance Statistics:</h3>
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center">
          <span className="px-3 py-1.5 bg-green-100 text-green-800 rounded-md font-medium text-sm inline-flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Present: {stats.present}
          </span>
        </div>
        <div className="flex items-center">
          <span className="px-3 py-1.5 bg-amber-100 text-amber-800 rounded-md font-medium text-sm inline-flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Excused: {stats.excused}
          </span>
        </div>
        <div className="flex items-center">
          <span className="px-3 py-1.5 bg-red-100 text-red-800 rounded-md font-medium text-sm inline-flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Absent: {stats.absent}
          </span>
        </div>
      </div>
    </div>
  )
} 