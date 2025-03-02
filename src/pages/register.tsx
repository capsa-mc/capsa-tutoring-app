// src/pages/register.tsx
import Link from "next/link";
import Layout from "../components/Layout";
import { AuthCard, Input, Button, Message } from "../components/AuthCard";
import { Form } from "../components/Form";
import { useFormState } from "../hooks/useFormState";
import { useFormValidation, commonRules } from "../hooks/useFormValidation";
import { useFormReset } from "../hooks/useFormReset";
import { supabase } from "../lib/supabaseClient";
import { AuthFormData } from "../types/form";

export default function Register() {
  const { loading, message, messageType, setFormState, handleError, setSuccess } = useFormState();
  
  const { formData, updateField } = useFormReset<AuthFormData>({
    email: "",
    password: "",
  });

  const { errors, validateForm, validateField } = useFormValidation({
    email: [commonRules.required("Email is required"), commonRules.email()],
    password: [commonRules.required("Password is required")],
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm(formData)) {
      return;
    }

    setFormState({ loading: true });

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error("No user data returned");
      }

      setSuccess("Registration successful! Please check your email for verification.");

    } catch (err) {
      handleError(err);
    }
  };

  return (
    <Layout>
      <AuthCard 
        title="Create Account" 
        subtitle="Sign up for a new account"
      >
        <Form onSubmit={handleRegister}>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => {
              updateField("email", e.target.value);
              validateField("email", e.target.value);
            }}
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
              onChange={(e) => {
                updateField("password", e.target.value);
                validateField("password", e.target.value);
              }}
              label="Password"
              placeholder="Enter your password"
              required
              error={errors.password?.[0]}
            />
          </div>

          <Button loading={loading} disabled={loading}>
            Create Account
          </Button>
        </Form>

        {message && messageType && <Message message={message} type={messageType} />}

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