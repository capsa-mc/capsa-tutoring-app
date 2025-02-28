import { useState } from "react";

export interface ValidationRule {
  test: (value: string) => boolean;
  message: string;
}

export interface ValidationRules {
  [key: string]: ValidationRule[];
}

export interface ValidationErrors {
  [key: string]: string[];
}

export const useFormValidation = <T extends Record<string, string>>(rules: {
  [K in keyof T]?: ValidationRule[];
}) => {
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateField = (name: keyof T, value: string): string[] => {
    if (!rules[name]) return [];

    return rules[name]!
      .map(rule => (!rule.test(value) ? rule.message : ""))
      .filter(Boolean);
  };

  const validateForm = (formData: T): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    (Object.keys(rules) as Array<keyof T>).forEach(fieldName => {
      const value = formData[fieldName];
      const fieldErrors = validateField(fieldName, value);
      if (fieldErrors.length > 0) {
        newErrors[fieldName as string] = fieldErrors;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const clearErrors = () => {
    setErrors({});
  };

  return {
    errors,
    validateField,
    validateForm,
    clearErrors,
  };
};

// Common validation rules
export const commonRules = {
  required: (message = "This field is required"): ValidationRule => ({
    test: (value) => value.trim().length > 0,
    message,
  }),
  email: (message = "Please enter a valid email address"): ValidationRule => ({
    test: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message,
  }),
  minLength: (length: number, message?: string): ValidationRule => ({
    test: (value) => value.length >= length,
    message: message || `Must be at least ${length} characters`,
  }),
  maxLength: (length: number, message?: string): ValidationRule => ({
    test: (value) => value.length <= length,
    message: message || `Must be no more than ${length} characters`,
  }),
  matches: (pattern: RegExp, message: string): ValidationRule => ({
    test: (value) => pattern.test(value),
    message,
  }),
}; 