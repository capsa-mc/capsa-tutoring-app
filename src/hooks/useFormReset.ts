import { useState, useCallback } from "react";

export type FormFields = {
  [key: string]: string;
}

export type UseFormResetReturn<T> = {
  formData: T;
  setFormData: (data: Partial<T>) => void;
  resetForm: () => void;
  clearField: (field: keyof T) => void;
}

export function useFormReset<T extends { [K in keyof T]: string }>(initialState: T): UseFormResetReturn<T> {
  const [formData, setFormDataState] = useState<T>(initialState);

  const setFormData = useCallback((data: Partial<T>) => {
    setFormDataState(prev => ({
      ...prev,
      ...data,
    }));
  }, []);

  const resetForm = useCallback(() => {
    setFormDataState(initialState);
  }, [initialState]);

  const clearField = useCallback((field: keyof T) => {
    setFormDataState(prev => ({
      ...prev,
      [field]: "",
    }));
  }, []);

  return {
    formData,
    setFormData,
    resetForm,
    clearField,
  };
} 