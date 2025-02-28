import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "../components/Layout";
import AuthCard from "../components/AuthCard";
import { Input, Button, Message } from "../components/AuthCard";
import { Form } from "../components/Form";
import { useFormState } from "../hooks/useFormState";
import { useFormValidation, commonRules } from "../hooks/useFormValidation";
import { AuthError } from "@supabase/supabase-js";

export default function Login() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const { loading, message, messageType, setFormState, handleError, setSuccess } = useFormState();
  const router = useRouter();

  const { errors, validateForm, validateField } = useFormValidation({
    email: [commonRules.required(), commonRules.email()],
    password: [commonRules.required(), commonRules.minLength(6)],
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState({ loading: true, message: "", messageType: "" });

    // Validate form
    const isValid = validateForm({ email, password });
    if (!isValid) {
      setFormState({
        loading: false,
        message: "Please fix the errors below.",
        messageType: "error",
      });
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Handle specific error cases with user-friendly messages
        if (error.message.includes("Invalid login credentials")) {
          handleError(error, "Incorrect email or password. Please check and try again.");
        } else if (error.message.includes("Email not confirmed")) {
          handleError(error, "Please verify your email first. Check your inbox for the verification link.");
        } else if (error.message.includes("Too many requests")) {
          handleError(error, "Too many login attempts. Please try again later.");
        } else if (error.message.includes("Invalid email")) {
          handleError(error, "Please enter a valid email address.");
        } else {
          handleError(error, "Unable to sign in. Please try again later.");
        }
        return;
      }

      if (data?.user) {
        // Check if profile exists and create if it doesn't
        const { error: profileError } = await supabase
          .from("profile")
          .select("*")
          .eq("id", data.user.id)
          .single();

        if (profileError && profileError.code === "PGRST116") {
          // Profile doesn't exist, create it
          const { error: insertError } = await supabase
            .from("profile")
            .insert([{ id: data.user.id, email: data.user.email }]);

          if (insertError) {
            console.error("Error creating profile:", insertError);
          }
        }

        setSuccess("Login successful! Redirecting...");

        // Get the return URL from query parameters or default to profile
        const returnUrl = router.query.returnUrl as string || "/profile";
        
        // Add a small delay to show the success message
        setTimeout(() => {
          router.push(returnUrl);
        }, 1000);
      }
    } catch (error: unknown) {
      if (error instanceof AuthError || error instanceof Error) {
        handleError(error);
      } else {
        handleError(null, "An unexpected error occurred during login. Please try again.");
      }
    }
  };

  return (
    <Layout>
      <AuthCard title="Welcome Back">
        <Form onSubmit={handleLogin}>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              validateField("email", e.target.value);
            }}
            label="Email"
            placeholder="Enter your email"
            required
            error={errors.email?.[0]}
          />

          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              validateField("password", e.target.value);
            }}
            label="Password"
            placeholder="Enter your password"
            required
            error={errors.password?.[0]}
          />

          <Button loading={loading} disabled={loading}>
            Sign In
          </Button>
        </Form>

        {message && <Message message={message} type={messageType as "error" | "success"} />}

        <div className="mt-6 space-y-4">
          <p className="text-center text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
              Create one here
            </Link>
          </p>
          <p className="text-center text-sm text-gray-600">
            <Link href="/reset-password" className="font-medium text-blue-600 hover:text-blue-500">
              Forgot your password?
            </Link>
          </p>
        </div>
      </AuthCard>
    </Layout>
  );
} 