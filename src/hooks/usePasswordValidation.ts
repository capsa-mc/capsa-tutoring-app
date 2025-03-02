import { useMemo } from "react";

interface PasswordRequirement {
  label: string;
  test: (value: string) => boolean;
}

interface UsePasswordValidationReturn {
  validatePassword: (value: string) => string | null;
  requirements: PasswordRequirement[];
  checkRequirement: (value: string, index: number) => boolean;
}

export function usePasswordValidation(): UsePasswordValidationReturn {
  const requirements = useMemo<PasswordRequirement[]>(() => [
    {
      label: "Be at least 8 characters long",
      test: (value) => value.length >= 8,
    },
    {
      label: "Include at least one uppercase letter",
      test: (value) => /[A-Z]/.test(value),
    },
    {
      label: "Include at least one lowercase letter",
      test: (value) => /[a-z]/.test(value),
    },
    {
      label: "Include at least one number",
      test: (value) => /[0-9]/.test(value),
    },
    {
      label: "Include at least one special character",
      test: (value) => /[!@#$%^&*(),.?":{}|<>]/.test(value),
    },
  ], []);

  const validatePassword = (value: string): string | null => {
    const failedRequirements = requirements.filter(
      (req) => !req.test(value)
    );

    if (failedRequirements.length > 0) {
      return `Password must: ${failedRequirements
        .map((req) => req.label.toLowerCase())
        .join(", ")}`;
    }

    return null;
  };

  const checkRequirement = (value: string, index: number): boolean => {
    return requirements[index].test(value);
  };

  return {
    validatePassword,
    requirements,
    checkRequirement,
  };
} 