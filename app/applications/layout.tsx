import { ReactNode } from 'react'
import { PageLayout } from '@/app/components'

export default function ApplicationsLayout({ children }: { children: ReactNode }) {
  return (
    <PageLayout className="bg-gray-50 pt-8">
      {children}
    </PageLayout>
  )
} 