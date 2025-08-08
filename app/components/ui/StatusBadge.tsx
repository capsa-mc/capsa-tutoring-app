import { FC, ReactNode } from 'react'
import { theme } from '@/app/styles/theme'

interface StatusBadgeProps {
  children: ReactNode
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral'
  showDot?: boolean
  className?: string
}

const StatusBadge: FC<StatusBadgeProps> = ({
  children,
  variant = 'neutral',
  showDot = false,
  className = ''
}) => {
  const badgeClasses = `
    ${theme.status.badge.base}
    ${theme.status.badge.variants[variant]}
    ${className}
  `.trim()

  return (
    <span className={badgeClasses}>
      {showDot && (
        <span className={`${theme.status.dot.base} ${theme.status.dot.variants[variant]} mr-1.5`} />
      )}
      {children}
    </span>
  )
}

export default StatusBadge