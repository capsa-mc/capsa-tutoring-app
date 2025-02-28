import { useState } from "react";

interface FormState {
  loading: boolean;
  message: string;
  messageType: "error" | "success" | "";
}

interface UseFormStateReturn extends FormState {
  setFormState: (state: Partial<FormState>) => void;
  resetFormState: () => void;
  handleError: (error: any, defaultMessage?: string) => void;
  setSuccess: (message: string) => void;
}

export function useFormState(initialState?: Partial<FormState>): UseFormStateReturn {
  const [formState, setFormStateInternal] = useState<FormState>({
    loading: false,
    message: "",
    messageType: "",
    ...initialState,
  });

  const setFormState = (state: Partial<FormState>) => {
    setFormStateInternal((prev) => ({ ...prev, ...state }));
  };

  const resetFormState = () => {
    setFormStateInternal({
      loading: false,
      message: "",
      messageType: "",
    });
  };

  const handleError = (error: any, defaultMessage = "An unexpected error occurred. Please try again.") => {
    console.error("Form error:", error);
    setFormState({
      loading: false,
      message: error?.message || defaultMessage,
      messageType: "error",
    });
  };

  const setSuccess = (message: string) => {
    setFormState({
      loading: false,
      message,
      messageType: "success",
    });
  };

  return {
    ...formState,
    setFormState,
    resetFormState,
    handleError,
    setSuccess,
  };
} 