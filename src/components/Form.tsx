import { ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

interface FormProps {
  children: ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  className?: string;
}

export function Form({ children, onSubmit, className = "space-y-6" }: FormProps) {
  return (
    <form onSubmit={onSubmit} className={className}>
      {children}
    </form>
  );
}

interface FormGroupProps {
  children: ReactNode;
  className?: string;
}

export function FormGroup({ children, className = "space-y-1" }: FormGroupProps) {
  return <div className={className}>{children}</div>;
}

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "value"> {
  label: string;
  error?: string;
  helperText?: string;
  options: readonly SelectOption[];
  value: string;
}

export function Select({ 
  label, 
  error, 
  helperText,
  options, 
  className = "", 
  ...props 
}: SelectProps) {
  return (
    <FormGroup>
      <label htmlFor={props.id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <select
        {...props}
        className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md ${
          error ? "border-red-300" : ""
        } ${className}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {helperText && !error && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
    </FormGroup>
  );
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export function TextArea({ 
  label, 
  error, 
  helperText,
  className = "", 
  ...props 
}: TextAreaProps) {
  return (
    <FormGroup>
      <label htmlFor={props.id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <textarea
        {...props}
        className={`mt-1 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border border-gray-300 rounded-md ${
          error ? "border-red-300" : ""
        } ${className}`}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {helperText && !error && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
    </FormGroup>
  );
}

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export function Checkbox({ 
  label, 
  error, 
  helperText,
  className = "", 
  ...props 
}: CheckboxProps) {
  return (
    <FormGroup className="flex items-start">
      <div className="flex items-center h-5">
        <input
          type="checkbox"
          {...props}
          className={`focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded ${
            error ? "border-red-300" : ""
          } ${className}`}
        />
      </div>
      <div className="ml-3 text-sm">
        <label htmlFor={props.id} className="font-medium text-gray-700">
          {label}
        </label>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        {helperText && !error && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
      </div>
    </FormGroup>
  );
}

interface RadioGroupProps {
  label: string;
  name: string;
  options: readonly SelectOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helperText?: string;
}

export function RadioGroup({ 
  label, 
  name, 
  options, 
  value, 
  onChange, 
  error,
  helperText 
}: RadioGroupProps) {
  return (
    <FormGroup>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="mt-2 space-y-2">
        {options.map((option) => (
          <div key={option.value} className="flex items-center">
            <input
              type="radio"
              id={`${name}-${option.value}`}
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange(e.target.value)}
              className={`focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 ${
                error ? "border-red-300" : ""
              }`}
            />
            <label
              htmlFor={`${name}-${option.value}`}
              className="ml-3 block text-sm font-medium text-gray-700"
            >
              {option.label}
            </label>
          </div>
        ))}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {helperText && !error && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
    </FormGroup>
  );
} 