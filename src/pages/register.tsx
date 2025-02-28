// src/pages/register.tsx
import { useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import Link from "next/link";
import Layout from "../components/Layout";
import AuthCard from "../components/AuthCard";
import { Input, Button, Message } from "../components/AuthCard";
import { Form } from "../components/Form";
import { useFormState } from "../hooks/useFormState";
import { useFormValidation, commonRules } from "../hooks/useFormValidation";
import { usePasswordValidation } from "../hooks/usePasswordValidation";
import { useDebounce } from "../hooks/useDebounce";
import { useFormReset } from "../hooks/useFormReset";
import { AuthError } from "@supabase/supabase-js";

interface RegisterForm extends Record<string, string> {
  email: string;
  password: string;
}

export default function Register() {
  const { formData, setFormData, resetForm } = useFormReset<RegisterForm>({
    email: "",
    password: "",
  });

  const debouncedEmail = useDebounce(formData.email);
  const debouncedPassword = useDebounce(formData.password);

  const { loading, message, messageType, setFormState, handleError, setSuccess } = useFormState();
  const { validatePassword, getPasswordRequirements } = usePasswordValidation();

  const { errors, validateForm, validateField } = useFormValidation({
    email: [commonRules.required(), commonRules.email()],
    password: [
      commonRules.required(),
      commonRules.minLength(8),
      {
        test: (value) => /[A-Z]/.test(value),
        message: "Must contain at least one uppercase letter",
      },
      {
        test: (value) => /[a-z]/.test(value),
        message: "Must contain at least one lowercase letter",
      },
      {
        test: (value) => /[0-9]/.test(value),
        message: "Must contain at least one number",
      },
      {
        test: (value) => /[^A-Za-z0-9]/.test(value),
        message: "Must contain at least one special character",
      },
    ],
  });

  // Validate on debounced values
  useEffect(() => {
    validateField("email", debouncedEmail);
  }, [debouncedEmail, validateField]);

  useEffect(() => {
    validateField("password", debouncedPassword);
  }, [debouncedPassword, validateField]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState({ loading: true, message: "", messageType: "" });

    // Validate form
    const isValid = validateForm(formData);
    if (!isValid) {
      setFormState({
        loading: false,
        message: "Please fix the errors below.",
        messageType: "error",
      });
      return;
    }

    // Validate password
    const validation = validatePassword(formData.password);
    if (!validation.isValid) {
      setFormState({
        loading: false,
        message: validation.errors[0],
        messageType: "error",
      });
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        if (error.message.includes("already exists")) {
          handleError(error, "This email is already registered. Please use a different email or try logging in.");
        } else {
          handleError(error);
        }
        return;
      }

      setSuccess("Registration successful! Please check your email for verification.");
      resetForm();
      
    } catch (error: unknown) {
      if (error instanceof AuthError || error instanceof Error) {
        handleError(error);
      } else {
        handleError(null, "An unexpected error occurred during registration. Please try again.");
      }
    }
  };

  const passwordRequirements = getPasswordRequirements();

  return (
    <Layout>
      <AuthCard title="Create Account">
        <Form onSubmit={handleRegister}>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ email: e.target.value })}
            label="Email"
            placeholder="Enter your email"
            required
            error={errors.email?.[0]}
          />

          <div>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ password: e.target.value })}
              label="Password"
              placeholder="Enter your password"
              required
              minLength={8}
              error={errors.password?.[0]}
            />
            <div className="mt-2 text-sm text-gray-500">
              <p>Your password must:</p>
              <ul className="list-disc pl-5 mt-1">
                {passwordRequirements.map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </div>
          </div>

          <Button loading={loading} disabled={loading}>
            Create Account
          </Button>
        </Form>

        {message && <Message message={message} type={messageType as "error" | "success"} />}

        <div className="mt-6">
          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in here
            </Link>
          </p>
        </div>
      </AuthCard>
    </Layout>
  );
}