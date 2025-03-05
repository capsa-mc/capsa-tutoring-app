import { ReactNode } from 'react'
import { PageLayout } from '@/app/components'

export default function PairsLayout({ children }: { children: ReactNode }) {
  return (
    <PageLayout>
      {children}
    </PageLayout>
  )
} 