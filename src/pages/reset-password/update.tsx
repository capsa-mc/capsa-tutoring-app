import { useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";
import Link from "next/link";
import Layout from "../../components/Layout";
import { AuthCard, Input, Button, Message } from "../../components/AuthCard";
import { Form } from "../../components/Form";
import { useFormState } from "../../hooks/useFormState";
import { useFormValidation, commonRules } from "../../hooks/useFormValidation";
import { usePasswordValidation } from "../../hooks/usePasswordValidation";
import { useDebounce } from "../../hooks/useDebounce";
import { useFormReset } from "../../hooks/useFormReset";

export default function UpdatePassword() {
  const router = useRouter();
  const { loading, message, messageType, setFormState, handleError, setSuccess } = useFormState();
  const { validatePassword, requirements, checkRequirement } = usePasswordValidation();
  
  const { formData, updateField, resetForm } = useFormReset<{
    password: string;
    confirmPassword: string;
  }>({
    password: "",
    confirmPassword: "",
  });

  const debouncedPassword = useDebounce(formData.password);
  const debouncedConfirmPassword = useDebounce(formData.confirmPassword);

  const { errors, validateForm, validateField } = useFormValidation({
    password: [
      commonRules.required("Password is required"),
      commonRules.custom(
        (value) => !validatePassword(value),
        validatePassword("") || "Invalid password"
      ),
    ],
    confirmPassword: [
      commonRules.required("Please confirm your password"),
      commonRules.match(formData.password, "Passwords do not match"),
    ],
  });

  // Validate on debounced values
  useEffect(() => {
    if (debouncedPassword) {
      validateField("password", debouncedPassword);
    }
  }, [debouncedPassword, validateField]);

  useEffect(() => {
    if (debouncedConfirmPassword) {
      validateField("confirmPassword", debouncedConfirmPassword);
    }
  }, [debouncedConfirmPassword, validateField, formData.password]);

  // Check access token on mount
  useEffect(() => {
    const accessToken = new URLSearchParams(window.location.hash.substring(1)).get("access_token");
    
    if (!accessToken) {
      handleError(new Error("This password reset link is invalid or has expired. Please request a new one."));
    }
  }, [handleError]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState({ loading: true, message: null, messageType: null });

    try {
      if (!validateForm(formData)) {
        setFormState({ loading: false });
        return;
      }

      const validation = validatePassword(formData.password);
      if (validation) {
        setFormState({
          loading: false,
          message: validation,
          messageType: "error"
        });
        return;
      }

      // Get the hash from the URL
      const hash = window.location.hash;
      if (!hash) {
        handleError(new Error("No reset token found. Please request a new password reset."));
        return;
      }

      // Parse the hash to get the access token
      const hashParams = new URLSearchParams(hash.substring(1));
      const type = hashParams.get("type");
      const accessToken = hashParams.get("access_token");

      if (!accessToken || type !== "recovery") {
        handleError(new Error("Invalid reset token. Please request a new password reset."));
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: formData.password
      });

      if (error) throw error;

      setSuccess("Password updated successfully! Redirecting to login...");
      resetForm();

      // Redirect to login page after a short delay
      setTimeout(() => {
        router.push("/login");
      }, 2000);

    } catch (error: unknown) {
      if (error instanceof Error) {
        handleError(error);
      } else {
        handleError(new Error("An unexpected error occurred while updating your password. Please try again."));
      }
    }
  };

  return (
    <Layout>
      <AuthCard title="Set New Password">
        <Form onSubmit={handleUpdatePassword}>
          <div>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => updateField("password", e.target.value)}
              label="New Password"
              placeholder="Enter new password"
              required
              minLength={8}
              error={errors.password?.[0]}
            />
            <div className="mt-2 text-sm text-gray-500">
              <p>Your password must:</p>
              <ul className="list-disc pl-5 mt-1">
                {requirements.map((req, index) => (
                  <li
                    key={index}
                    className={
                      formData.password
                        ? checkRequirement(formData.password, index)
                          ? "text-green-600"
                          : "text-red-600"
                        : ""
                    }
                  >
                    {req.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => updateField("confirmPassword", e.target.value)}
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