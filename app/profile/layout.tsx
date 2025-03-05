import React from 'react'
import { PageLayout } from '@/app/components'

interface ProfileLayoutProps {
  children: React.ReactNode
}

const ProfileLayout: React.FC<ProfileLayoutProps> = ({ children }) => {
  return (
    <PageLayout>
      {children}
    </PageLayout>
  )
}

export default ProfileLayout 