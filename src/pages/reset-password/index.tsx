import { useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import Link from "next/link";
import Layout from "../../components/Layout";
import AuthCard from "../../components/AuthCard";
import { Input, Button, Message } from "../../components/AuthCard";
import { Form } from "../../components/Form";
import { useFormState } from "../../hooks/useFormState";
import { useFormValidation, commonRules } from "../../hooks/useFormValidation";
import { useDebounce } from "../../hooks/useDebounce";
import { useFormReset } from "../../hooks/useFormReset";
import { AuthError } from "@supabase/supabase-js";

interface ResetPasswordForm extends Record<string, string> {
  email: string;
}

export default function ResetPassword() {
  const { formData, setFormData, resetForm } = useFormReset<ResetPasswordForm>({
    email: "",
  });

  const debouncedEmail = useDebounce(formData.email);
  const { loading, message, messageType, setFormState, handleError, setSuccess } = useFormState();

  const { errors, validateForm, validateField } = useFormValidation({
    email: [commonRules.required(), commonRules.email()],
  });

  // Validate on debounced values
  useEffect(() => {
    validateField("email", debouncedEmail);
  }, [debouncedEmail, validateField]);

  const handleResetPassword = async (e: React.FormEvent) => {
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

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/reset-password/update`,
      });

      if (error) {
        if (error.message.includes("Email not found")) {
          handleError(error, "No account found with this email address.");
        } else if (error.message.includes("Too many requests")) {
          handleError(error, "Too many reset attempts. Please try again later.");
        } else {
          handleError(error);
        }
        return;
      }

      setSuccess("Password reset instructions have been sent to your email.");
      resetForm();
    } catch (error: unknown) {
      if (error instanceof AuthError || error instanceof Error) {
        handleError(error);
      } else {
        handleError(null, "An unexpected error occurred while requesting password reset. Please try again.");
      }
    }
  };

  return (
    <Layout>
      <AuthCard title="Reset Password">
        <Form onSubmit={handleResetPassword}>
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

          <Button loading={loading} disabled={loading}>
            Send Reset Instructions
          </Button>
        </Form>

        {message && <Message message={message} type={messageType as "error" | "success"} />}

        <div className="mt-6">
          <p className="text-center text-sm text-gray-600">
            Remember your password?{" "}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in here
            </Link>
          </p>
        </div>
      </AuthCard>
    </Layout>
  );
} 