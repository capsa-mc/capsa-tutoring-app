import { useState } from "react";
import { FormState, FormMessageType } from "../types/form";
import { handleError as handleAppError } from "../lib/errorHandler";

interface UseFormStateReturn extends FormState {
  setFormState: (state: Partial<FormState>) => void;
  handleError: (error: unknown) => void;
  setSuccess: (message: string) => void;
  setInfo: (message: string) => void;
  setWarning: (message: string) => void;
  clearMessage: () => void;
  reset: () => void;
}

const initialState: FormState = {
  loading: false,
  message: null,
  messageType: null,
  error: null,
};

export function useFormState(): UseFormStateReturn {
  const [state, setState] = useState<FormState>(initialState);

  const setFormState = (newState: Partial<FormState>) => {
    setState(prev => ({ ...prev, ...newState }));
  };

  const setMessage = (message: string, type: FormMessageType) => {
    setFormState({
      message,
      messageType: type,
      error: null,
      loading: false,
    });
  };

  const handleError = (error: unknown) => {
    const appError = handleAppError(error);
    setFormState({
      error: appError,
      message: appError?.message || "An unexpected error occurred",
      messageType: "error",
      loading: false,
    });
  };

  const setSuccess = (message: string) => setMessage(message, "success");
  const setInfo = (message: string) => setMessage(message, "info");
  const setWarning = (message: string) => setMessage(message, "warning");

  const clearMessage = () => {
    setFormState({
      message: null,
      messageType: null,
      error: null,
    });
  };

  const reset = () => {
    setState(initialState);
  };

  return {
    ...state,
    setFormState,
    handleError,
    setSuccess,
    setInfo,
    setWarning,
    clearMessage,
    reset,
  };
} 