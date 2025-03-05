import { ReactNode } from 'react'
import { PageLayout } from '@/app/components'

export default function SessionsLayout({ children }: { children: ReactNode }) {
  return (
    <PageLayout>
      {children}
    </PageLayout>
  )
} 