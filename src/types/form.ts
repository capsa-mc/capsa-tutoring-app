import { AppError } from "../lib/errorHandler";

export type FormMessageType = "error" | "success" | "info" | "warning";

export interface FormState {
  loading: boolean;
  message: string | null;
  messageType: FormMessageType | null;
  error: AppError;
}

export interface ValidationRule {
  validate: (value: string) => boolean;
  message: string;
}

export type ValidationRules = Record<string, ValidationRule[]>;

export type ValidationErrors = Record<string, string[]>;

export interface FormValidation {
  errors: ValidationErrors;
  validateForm: <T extends Record<string, unknown>>(data: T) => boolean;
  validateField: (field: string, value: string) => boolean;
  clearErrors: () => void;
  setErrors: (errors: ValidationErrors) => void;
}

export interface FormData {
  [key: string]: string | number | boolean | null;
}

export interface AuthFormData extends FormData {
  email: string;
  password: string;
}

export interface ProfileFormData extends FormData {
  first_name: string;
  last_name: string;
  email: string;
}

export interface PairFormData extends FormData {
  tutor_id: string;
  tutee_id: string;
}

export interface SessionFormData extends FormData {
  pair_id: string;
  start_time: string;
  end_time: string;
  status: "scheduled" | "completed" | "cancelled";
  notes: string | null;
}

export interface AttendanceFormData extends FormData {
  session_id: string;
  user_id: string;
  status: "present" | "absent" | "late";
  notes: string | null;
} 