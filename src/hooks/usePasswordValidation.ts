interface PasswordValidationRules {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function usePasswordValidation(rules: PasswordValidationRules = {}) {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = false,
  } = rules;

  const validatePassword = (password: string): ValidationResult => {
    const errors: string[] = [];

    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }

    if (requireUppercase && !/[A-Z]/.test(password)) {
      errors.push("Password must include at least one uppercase letter");
    }

    if (requireLowercase && !/[a-z]/.test(password)) {
      errors.push("Password must include at least one lowercase letter");
    }

    if (requireNumbers && !/\d/.test(password)) {
      errors.push("Password must include at least one number");
    }

    if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push("Password must include at least one special character");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  const getPasswordRequirements = (): string[] => {
    const requirements: string[] = [
      `Be at least ${minLength} characters long`,
    ];

    if (requireUppercase) requirements.push("Include at least one uppercase letter");
    if (requireLowercase) requirements.push("Include at least one lowercase letter");
    if (requireNumbers) requirements.push("Include at least one number");
    if (requireSpecialChars) requirements.push("Include at least one special character");

    return requirements;
  };

  return {
    validatePassword,
    getPasswordRequirements,
  };
} 