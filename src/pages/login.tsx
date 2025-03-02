import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "../components/Layout";
import { AuthCard, Input, Button, Message } from "../components/AuthCard";
import { Form } from "../components/Form";
import { useFormState } from "../hooks/useFormState";
import { useFormValidation, commonRules } from "../hooks/useFormValidation";
import { useFormReset } from "../hooks/useFormReset";
import { supabase } from "../lib/supabaseClient";
import { AuthFormData } from "../types/form";

export default function Login() {
  const router = useRouter();
  const { loading, message, messageType, setFormState, handleError, setSuccess } = useFormState();
  
  const { formData, updateField } = useFormReset<AuthFormData>({
    email: "",
    password: "",
  });

  const { errors, validateForm, validateField } = useFormValidation({
    email: [commonRules.required("Email is required"), commonRules.email()],
    password: [commonRules.required("Password is required")],
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm(formData)) {
      return;
    }

    setFormState({ loading: true });

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error("No user data returned");
      }

      // Check if user has a profile
      const { error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (profileError) {
        // If profile doesn't exist, create one
        if (profileError.code === "PGRST116") {
          const { error: createError } = await supabase
            .from("profiles")
            .insert([{ id: authData.user.id }]);

          if (createError) {
            throw createError;
          }
        } else {
          throw profileError;
        }
      }

      setSuccess("Login successful!");
      
      // Redirect to the return URL if provided, otherwise go to profile
      const returnUrl = router.query.returnUrl as string;
      await router.push(returnUrl || "/profile");

    } catch (err) {
      handleError(err);
    }
  };

  return (
    <Layout>
      <AuthCard 
        title="Welcome Back" 
        subtitle="Sign in to your account to continue"
      >
        <Form onSubmit={handleLogin}>
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

          <Button loading={loading} disabled={loading}>
            Sign in
          </Button>
        </Form>

        {message && messageType && <Message message={message} type={messageType} />}

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