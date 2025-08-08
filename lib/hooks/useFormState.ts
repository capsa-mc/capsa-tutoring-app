import { useState, useCallback } from 'react'

interface UseFormStateOptions<T> {
  initialValues: T
  validate?: (values: T) => Partial<Record<keyof T, string>>
}

interface UseFormStateReturn<T> {
  values: T
  errors: Partial<Record<keyof T, string>>
  loading: boolean
  success: boolean
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  handleSubmit: (onSubmit: (values: T) => Promise<void>) => (e: React.FormEvent) => Promise<void>
  setValues: React.Dispatch<React.SetStateAction<T>>
  setErrors: React.Dispatch<React.SetStateAction<Partial<Record<keyof T, string>>>>
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
  setSuccess: React.Dispatch<React.SetStateAction<boolean>>
  reset: () => void
}

export function useFormState<T extends Record<string, unknown>>({
  initialValues,
  validate
}: UseFormStateOptions<T>): UseFormStateReturn<T> {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    
    setValues(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }))
    
    // Clear error for this field when user starts typing
    if (errors[name as keyof T]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }))
    }
    
    // Clear success state when form is modified
    if (success) {
      setSuccess(false)
    }
  }, [errors, success])

  const handleSubmit = useCallback((onSubmit: (values: T) => Promise<void>) => {
    return async (e: React.FormEvent) => {
      e.preventDefault()
      
      // Run validation if provided
      if (validate) {
        const validationErrors = validate(values)
        if (Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors)
          return
        }
      }
      
      // Clear any existing errors
      setErrors({})
      setLoading(true)
      
      try {
        await onSubmit(values)
        setSuccess(true)
      } catch (error) {
        // Error handling is expected to be done in the onSubmit callback
        console.error('Form submission error:', error)
      } finally {
        setLoading(false)
      }
    }
  }, [values, validate])

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setLoading(false)
    setSuccess(false)
  }, [initialValues])

  return {
    values,
    errors,
    loading,
    success,
    handleChange,
    handleSubmit,
    setValues,
    setErrors,
    setLoading,
    setSuccess,
    reset
  }
}