import { PostgrestError } from "@supabase/supabase-js";

export type AppError = Error | PostgrestError | null;

export function handleError(error: unknown): AppError {
  if (error instanceof Error || error instanceof PostgrestError) {
    return error;
  }
  if (typeof error === 'string') {
    return new Error(error);
  }
  return new Error('An unexpected error occurred');
}

export function getErrorMessage(error: AppError): string {
  if (!error) return '';
  
  if (error instanceof PostgrestError) {
    return error.message || 'Database error occurred';
  }
  
  return error.message || 'An unexpected error occurred';
}

export function isPostgrestError(error: AppError): error is PostgrestError {
  return error instanceof PostgrestError;
} 