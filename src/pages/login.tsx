import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";
import Link from "next/link";
import { AuthError } from "@supabase/supabase-js";
import Layout from "../components/Layout";
import AuthCard from "../components/AuthCard";
import { Form } from "../components/Form";
import { Input, Button, Message } from "../components/AuthCard";
import { useFormState } from "../hooks/useFormState";
import { useFormValidation, commonRules } from "../hooks/useFormValidation";
import { useFormReset } from "../hooks/useFormReset";

export default function Login() {
  const router = useRouter();
  const { loading, message, messageType, setFormState, handleError, setSuccess } = useFormState();
  
  const { formData, setFormData } = useFormReset({
    email: "",
    password: "",
  });

  const { errors, validateForm, validateField } = useFormValidation({
    email: [commonRules.required("Email is required"), commonRules.email()],
    password: [commonRules.required("Password is required")],
  });

  const handleLogin = async (e: React.FormEvent) => {
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setFormState({
            loading: false,
            message: "Invalid email or password. Please check your credentials and try again.",
            messageType: "error"
          });
        } else if (error.message.includes("Email not confirmed")) {
          setFormState({
            loading: false,
            message: "Please verify your email before logging in. Check your inbox for the verification link.",
            messageType: "error"
          });
        } else {
          setFormState({
            loading: false,
            message: error.message,
            messageType: "error"
          });
        }
        return;
      }

      if (data?.user) {
        try {
          // Check if profile exists
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", data.user.id)
            .single();

          if (profileError && profileError.code === "PGRST116") {
            // Profile doesn't exist, create it with only id field
            console.log("Creating new profile for user:", data.user.id);
            
            const { error: insertError } = await supabase
              .from("profiles")
              .insert([{ id: data.user.id }])
              .select()
              .single();

            if (insertError) {
              console.error("Detailed insert error:", {
                code: insertError.code,
                message: insertError.message,
                details: insertError.details,
                hint: insertError.hint
              });
              setFormState({
                loading: false,
                message: `Failed to create user profile: ${insertError.message}`,
                messageType: "error"
              });
              return;
            }
          } else if (profileError) {
            console.error("Error checking profile:", profileError);
            setFormState({
              loading: false,
              message: "Failed to verify user profile. Please try again.",
              messageType: "error"
            });
            return;
          }

          setFormState({
            loading: false,
            message: "Login successful! Redirecting...",
            messageType: "success"
          });
            
          // Get the return URL from query parameters or default to profile
          const returnUrl = router.query.returnUrl as string || "/profile";
            
          // Add a small delay to show the success message
          setTimeout(() => {
            router.push(returnUrl);
          }, 1000);

        } catch (error) {
          console.error("Profile creation error:", error);
          setFormState({
            loading: false,
            message: "An error occurred during login. Please try again.",
            messageType: "error"
          });
        }
      }
    } catch (error: unknown) {
      console.error("Login error:", error);
      setFormState({
        loading: false,
        message: "An unexpected error occurred during login. Please try again.",
        messageType: "error"
      });
    }
  };

  return (
    <Layout>
      <AuthCard title="Sign in to your account">
        <Form onSubmit={handleLogin}>
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
            error={errors.password?.[0]}
          />

          <Button loading={loading} disabled={loading}>
            Sign in
          </Button>
        </Form>

        {message && <Message message={message} type={messageType as "error" | "success"} />}

        <div className="mt-6 space-y-4">
          <p className="text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
              Sign up
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