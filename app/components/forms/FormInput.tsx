'use client'

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
    <div className={`space-y-2 ${className || ''}`}>
      <label htmlFor={id} className="block text-base font-medium text-gray-800">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        value={value}
        onChange={onChange}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-base py-2.5"
        placeholder={placeholder}
        minLength={minLength}
      />
    </div>
  )
} 