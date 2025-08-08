import { FC, ReactNode } from 'react'
import { Dialog as HeadlessDialog } from '@headlessui/react'
import { theme } from '@/app/styles/theme'
import ThemedButton from './ThemedButton'

interface DialogContentProps {
  title: string
  children: ReactNode
  onConfirm?: () => void
  onCancel?: () => void
  confirmText?: string
  cancelText?: string
  confirmVariant?: 'primary' | 'danger' | 'success'
  loading?: boolean
  showActions?: boolean
}

const DialogContent: FC<DialogContentProps> = ({
  title,
  children,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  loading = false,
  showActions = true
}) => {
  return (
    <div className="p-6">
      <HeadlessDialog.Title className={theme.dialog.title}>
        {title}
      </HeadlessDialog.Title>
      
      <div className={theme.dialog.content}>
        {children}
      </div>

      {showActions && (
        <div className={theme.dialog.actions}>
          {onCancel && (
            <ThemedButton
              variant="ghost"
              onClick={onCancel}
              disabled={loading}
              className="sm:col-start-1"
            >
              {cancelText}
            </ThemedButton>
          )}
          {onConfirm && (
            <ThemedButton
              variant={confirmVariant}
              onClick={onConfirm}
              loading={loading}
              className="sm:col-start-2"
            >
              {confirmText}
            </ThemedButton>
          )}
        </div>
      )}
    </div>
  )
}

export default DialogContent