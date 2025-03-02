import { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes } from "react";
import { FormMessageType } from "../types/form";

interface AuthCardProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
}

export function AuthCard({ title, subtitle, children, className = "" }: AuthCardProps) {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 text-center text-sm text-gray-600">
            {subtitle}
          </p>
        )}
      </div>

      <div className={`mt-8 sm:mx-auto sm:w-full sm:max-w-md ${className}`}>
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {children}
        </div>
      </div>
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export function Input({ 
  label, 
  error, 
  helperText,
  className = "", 
  ...props 
}: InputProps) {
  return (
    <div>
      <label htmlFor={props.id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="mt-1">
        <input
          {...props}
          className={`appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
            error ? "border-red-300" : ""
          } ${className}`}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {helperText && !error && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
    </div>
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger";
}

export function Button({ 
  children, 
  loading = false, 
  variant = "primary",
  className = "", 
  ...props 
}: ButtonProps) {
  const baseClasses = "w-full flex justify-center py-2 px-4 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variantClasses = {
    primary: "border-transparent text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
    secondary: "border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500",
    danger: "border-transparent text-white bg-red-600 hover:bg-red-700 focus:ring-red-500",
  };

  return (
    <button
      type="submit"
      disabled={loading || props.disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : null}
      {children}
    </button>
  );
}

interface MessageProps {
  message: string;
  type: FormMessageType;
}

export function Message({ message, type }: MessageProps) {
  const bgColors = {
    error: "bg-red-50",
    success: "bg-green-50",
    info: "bg-blue-50",
    warning: "bg-yellow-50",
  };

  const textColors = {
    error: "text-red-800",
    success: "text-green-800",
    info: "text-blue-800",
    warning: "text-yellow-800",
  };

  const borderColors = {
    error: "border-red-400",
    success: "border-green-400",
    info: "border-blue-400",
    warning: "border-yellow-400",
  };

  return (
    <div className={`mt-4 rounded-md ${bgColors[type]} p-4 border ${borderColors[type]}`}>
      <p className={`text-sm font-medium ${textColors[type]}`}>{message}</p>
    </div>
  );
} 