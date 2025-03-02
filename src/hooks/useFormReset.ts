import { useState, useCallback } from "react";
import { FormData } from "../types/form";

interface UseFormResetReturn<T extends FormData> {
  formData: T;
  setFormData: (data: Partial<T>) => void;
  resetForm: (data?: T) => void;
  updateField: (field: keyof T, value: T[keyof T]) => void;
}

export function useFormReset<T extends FormData>(initialData: T): UseFormResetReturn<T> {
  const [formData, setFormDataInternal] = useState<T>(initialData);

  const setFormData = useCallback((data: Partial<T>) => {
    setFormDataInternal(prev => ({ ...prev, ...data }));
  }, []);

  const updateField = useCallback((field: keyof T, value: T[keyof T]) => {
    setFormDataInternal(prev => ({ ...prev, [field]: value }));
  }, []);

  const resetForm = useCallback((data?: T) => {
    setFormDataInternal(data || initialData);
  }, [initialData]);

  return {
    formData,
    setFormData,
    resetForm,
    updateField,
  };
} 