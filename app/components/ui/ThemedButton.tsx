import { FC, ReactNode } from 'react'
import { theme } from '@/app/styles/theme'
import LoadingSpinner from './LoadingSpinner'

interface ThemedButtonProps {
  children: ReactNode
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  onClick?: () => void
  className?: string
}

const ThemedButton: FC<ThemedButtonProps> = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  className = ''
}) => {
  const isDisabled = disabled || loading

  const buttonClasses = `
    ${theme.button.base}
    ${theme.button.variants[variant]}
    ${theme.button.sizes[size]}
    ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${className}
  `.trim()

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={buttonClasses}
    >
      {loading && (
        <LoadingSpinner 
          size={size === 'sm' ? 'sm' : 'md'} 
          color={variant === 'ghost' || variant === 'outline' ? 'gray' : 'white'}
          className="-ml-1 mr-2"
        />
      )}
      {children}
    </button>
  )
}

export default ThemedButton