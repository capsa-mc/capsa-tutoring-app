import { useState } from "react";
import { ValidationRule, ValidationRules, ValidationErrors, FormValidation } from "../types/form";

export function useFormValidation(rules: ValidationRules): FormValidation {
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateField = (field: string, value: string): boolean => {
    const fieldRules = rules[field];
    if (!fieldRules) return true;

    const fieldErrors: string[] = [];
    for (const rule of fieldRules) {
      if (!rule.validate(value)) {
        fieldErrors.push(rule.message);
      }
    }

    setErrors(prev => ({
      ...prev,
      [field]: fieldErrors
    }));

    return fieldErrors.length === 0;
  };

  const validateForm = <T extends Record<string, unknown>>(data: T): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    for (const field in rules) {
      const value = String(data[field] || "");
      const fieldRules = rules[field];

      if (!fieldRules) continue;

      const fieldErrors: string[] = [];
      for (const rule of fieldRules) {
        if (!rule.validate(value)) {
          fieldErrors.push(rule.message);
          isValid = false;
        }
      }

      if (fieldErrors.length > 0) {
        newErrors[field] = fieldErrors;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const clearErrors = () => setErrors({});

  return {
    errors,
    validateForm,
    validateField,
    clearErrors,
    setErrors,
  };
}

export const commonRules = {
  required: (message = "This field is required"): ValidationRule => ({
    validate: (value: string) => value.trim().length > 0,
    message,
  }),

  email: (message = "Please enter a valid email address"): ValidationRule => ({
    validate: (value: string) =>
      /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value),
    message,
  }),

  minLength: (length: number, message?: string): ValidationRule => ({
    validate: (value: string) => value.length >= length,
    message: message || `Must be at least ${length} characters`,
  }),

  maxLength: (length: number, message?: string): ValidationRule => ({
    validate: (value: string) => value.length <= length,
    message: message || `Must be no more than ${length} characters`,
  }),

  pattern: (pattern: RegExp, message: string): ValidationRule => ({
    validate: (value: string) => pattern.test(value),
    message,
  }),

  match: (matchValue: string, message: string): ValidationRule => ({
    validate: (value: string) => value === matchValue,
    message,
  }),

  custom: (validateFn: (value: string) => boolean, message: string): ValidationRule => ({
    validate: validateFn,
    message,
  }),
}; 