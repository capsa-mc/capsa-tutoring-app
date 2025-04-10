import { PageLayout } from '@/app/components'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PageLayout>
      {children}
    </PageLayout>
  )
} 