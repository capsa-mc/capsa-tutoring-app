import { useState } from "react";
import { PostgrestError } from "@supabase/supabase-js";

type MessageType = "error" | "success" | "";

interface FormState {
  loading: boolean;
  message: string;
  messageType: MessageType;
}

interface UseFormStateReturn extends FormState {
  setFormState: (state: Partial<FormState>) => void;
  resetFormState: () => void;
  handleError: (error: Error | PostgrestError | null, customMessage?: string) => void;
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

  const handleError = (error: Error | PostgrestError | null, customMessage?: string) => {
    console.error("Error:", error);
    setFormState({
      loading: false,
      message: customMessage || error?.message || "An unexpected error occurred",
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