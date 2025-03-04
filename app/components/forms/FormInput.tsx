'use client'

import { theme } from '@/app/styles/theme'

interface FormInputProps {
  id: string
  name: string
  type: string
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean
  placeholder?: string
  minLength?: number
  className?: string
}

export default function FormInput({
  id,
  name,
  type,
  label,
  value,
  onChange,
  required = false,
  placeholder,
  minLength,
  className
}: FormInputProps) {
  return (
    <div className={`${theme.form.group} ${className || ''}`}>
      <label htmlFor={id} className={theme.text.label}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        value={value}
        onChange={onChange}
        className={theme.input.base}
        placeholder={placeholder}
        minLength={minLength}
      />
    </div>
  )
} 