import { ReactNode } from "react";

interface AuthCardProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
}

export default function AuthCard({ 
  children, 
  title, 
  subtitle,
  className = "max-w-md mx-auto mt-8 px-4 sm:px-6 lg:px-8"
}: AuthCardProps) {
  return (
    <div className={className}>
      <div className="bg-white py-8 px-6 shadow-xl rounded-lg sm:px-10">
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-4">{title}</h1>
        {subtitle && (
          <p className="text-center text-gray-600 mb-8">{subtitle}</p>
        )}
        {children}
      </div>
    </div>
  );
}

// Message component for displaying success/error messages
interface MessageProps {
  message: string;
  type: "error" | "success";
}

export function Message({ message, type }: MessageProps) {
  const styles = {
    error: "bg-red-50 text-red-700 border border-red-200",
    success: "bg-green-50 text-green-700 border border-green-200"
  };

  return (
    <div className={`mt-6 rounded-md p-4 ${styles[type]}`}>
      <p className="text-sm">{message}</p>
    </div>
  );
}

// Input component for form fields
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  helperText,
  className = "", 
  ...props 
}) => {
  return (
    <div className="mb-4">
      <label htmlFor={props.id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
          error ? "border-red-300" : ""
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {helperText && !error && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
    </div>
  );
};

// Button component for form submission
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger";
  children: ReactNode;
}

export function Button({
  loading = false,
  disabled = false,
  variant = "primary",
  children,
  className = "",
  type = "submit",
  ...props
}: ButtonProps) {
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-gray-600 hover:bg-gray-700 focus:ring-gray-500",
    danger: "bg-red-600 hover:bg-red-700 focus:ring-red-500"
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${variants[variant]} focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {loading ? (
        <span className="flex items-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </span>
      ) : children}
    </button>
  );
} 