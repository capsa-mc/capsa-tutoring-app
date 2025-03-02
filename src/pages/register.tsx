// src/pages/register.tsx
import { useRouter } from "next/router";
import Link from "next/link";
import { AuthError } from "@supabase/supabase-js";
import Layout from "../components/Layout";
import AuthCard from "../components/AuthCard";
import { Form } from "../components/Form";
import { Input, Button, Message } from "../components/AuthCard";
import { useFormState } from "../hooks/useFormState";
import { useFormValidation, commonRules } from "../hooks/useFormValidation";
import { usePasswordValidation } from "../hooks/usePasswordValidation";
import { useFormReset } from "../hooks/useFormReset";
import { supabase } from "../lib/supabaseClient";

interface RegisterForm extends Record<string, string> {
  email: string;
  password: string;
}

const passwordRequirements = [
  "Be at least 8 characters long",
  "Include at least one uppercase letter",
  "Include at least one lowercase letter",
  "Include at least one number",
  "Include at least one special character",
];

export default function Register() {
  const router = useRouter();
  const { loading, message, messageType, setFormState, handleError, setSuccess } = useFormState();
  
  const { formData, setFormData } = useFormReset<RegisterForm>({
    email: "",
    password: "",
  });

  const { validatePassword } = usePasswordValidation();

  const { errors, validateForm, validateField } = useFormValidation({
    email: [commonRules.required("Email is required"), commonRules.email()],
    password: [
      commonRules.required("Password is required"),
      (value) => {
        const passwordError = validatePassword(value);
        return passwordError ? passwordError : "";
      },
    ],
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
      setFormData({ email: "", password: "" });

    } catch (error) {
      if (error instanceof AuthError) {
        handleError(new Error(error.message));
      } else if (error instanceof Error) {
        handleError(error);
      } else {
        console.error("Registration error:", error);
        handleError(new Error("An unexpected error occurred during registration. Please try again."));
      }
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
              setFormData({ email: e.target.value });
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
                setFormData({ password: e.target.value });
                validateField("password", e.target.value);
              }}
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