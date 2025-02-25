'use client'

import { useEffect, useState } from 'react'

interface Role {
  id: number
  name: string
  description?: string
  created_at?: string
  // Add other fields that exist in your roles table
}

export default function Home() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRoles() {
      try {
        console.log('Frontend: Fetching roles...')
        const response = await fetch('/api/tables')
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch roles')
        }

        console.log('Frontend: Successfully fetched roles')
        setRoles(result.data)
      } catch (error) {
        console.error('Frontend Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRoles()
  }, [])

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">Roles List</h1>
      
      {loading ? (
        <p>Loading roles...</p>
      ) : roles.length === 0 ? (
        <p>No roles found in the database.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <div
              key={role.id}
              className="p-4 border rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <h2 className="text-xl font-semibold mb-2">{role.name}</h2>
              {role.description && (
                <p className="text-gray-600 mb-2">{role.description}</p>
              )}
              {role.created_at && (
                <p className="text-sm text-gray-500">
                  Created: {new Date(role.created_at).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  )
} 