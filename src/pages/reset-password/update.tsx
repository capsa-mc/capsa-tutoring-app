import { useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";
import Link from "next/link";
import Layout from "../../components/Layout";
import AuthCard from "../../components/AuthCard";
import { Input, Button, Message } from "../../components/AuthCard";
import { Form } from "../../components/Form";
import { useFormState } from "../../hooks/useFormState";
import { useFormValidation, commonRules } from "../../hooks/useFormValidation";
import { usePasswordValidation } from "../../hooks/usePasswordValidation";
import { useDebounce } from "../../hooks/useDebounce";
import { useFormReset } from "../../hooks/useFormReset";

interface UpdatePasswordForm {
  password: string;
  confirmPassword: string;
}

export default function UpdatePassword() {
  const { formData, setFormData, resetForm } = useFormReset<UpdatePasswordForm>({
    password: "",
    confirmPassword: "",
  });

  const debouncedPassword = useDebounce(formData.password);
  const debouncedConfirmPassword = useDebounce(formData.confirmPassword);

  const { loading, message, messageType, setFormState, handleError, setSuccess } = useFormState();
  const { validatePassword, getPasswordRequirements } = usePasswordValidation();
  const router = useRouter();

  const { errors, validateForm, validateField } = useFormValidation({
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
    confirmPassword: [
      commonRules.required(),
      {
        test: (value) => value === formData.password,
        message: "Passwords do not match",
      },
    ],
  });

  // Validate on debounced values
  useEffect(() => {
    validateField("password", debouncedPassword);
    // Also validate confirm password when password changes
    if (formData.confirmPassword) {
      validateField("confirmPassword", formData.confirmPassword);
    }
  }, [debouncedPassword, formData.confirmPassword, validateField]);

  useEffect(() => {
    validateField("confirmPassword", debouncedConfirmPassword);
  }, [debouncedConfirmPassword, validateField]);

  useEffect(() => {
    // Check if we have the access token in the URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");
    
    if (!accessToken) {
      handleError(null, "This password reset link is invalid or has expired. Please request a new one.");
    }
  }, [handleError]);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
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
      const { error } = await supabase.auth.updateUser({
        password: formData.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          handleError(error, "This password reset link has expired. Please request a new one.");
        } else {
          handleError(error, "An error occurred while updating your password. Please try again.");
        }
        return;
      }

      setSuccess("Your password has been updated successfully! Redirecting to login page...");
      resetForm();

      // Redirect to login page after a delay
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error: any) {
      handleError(error);
    }
  };

  const passwordRequirements = getPasswordRequirements();

  return (
    <Layout>
      <AuthCard title="Set New Password">
        <Form onSubmit={handlePasswordUpdate}>
          <div>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ password: e.target.value })}
              label="New Password"
              placeholder="Enter new password"
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

          <Input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ confirmPassword: e.target.value })}
            label="Confirm Password"
            placeholder="Confirm new password"
            required
            minLength={8}
            error={errors.confirmPassword?.[0]}
          />

          <Button loading={loading} disabled={loading || !formData.password || !formData.confirmPassword}>
            Update Password
          </Button>
        </Form>

        {message && <Message message={message} type={messageType as "error" | "success"} />}

        <div className="mt-6 text-center">
          <Link href="/reset-password" className="text-sm text-blue-600 hover:text-blue-500">
            Need a new reset link?
          </Link>
        </div>
      </AuthCard>
    </Layout>
  );
} 