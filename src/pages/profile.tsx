import { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import Layout from "../components/Layout";
import ProtectedRoute from "../components/ProtectedRoute";
import { Input, Button, Message } from "../components/AuthCard";
import { Form, Select } from "../components/Form";
import { useFormState } from "../hooks/useFormState";
import { useFormValidation, commonRules } from "../hooks/useFormValidation";
import { useFormReset } from "../hooks/useFormReset";
import { useAuth } from "../contexts/AuthContext";
import type { Profile, UserRole, SchoolGroup } from "../lib/database.types";

type ProfileFormData = Omit<Profile, "id" | "created_at" | "updated_at" | "role">;

const GROUP_OPTIONS = [
  { value: "ADMIN", label: "Administrative" },
  { value: "LES", label: "Lower Elementary School" },
  { value: "UES", label: "Upper Elementary School" },
  { value: "MHS", label: "Middle High School" },
] as const satisfies readonly { value: SchoolGroup; label: string }[];

const ROLE_OPTIONS = [
  { value: "admin", label: "Administrator" },
  { value: "staff", label: "Staff" },
  { value: "coordinator", label: "Coordinator" },
  { value: "tutor", label: "Tutor" },
  { value: "tutee", label: "Student" },
] as const satisfies readonly { value: UserRole; label: string }[];

export default function Profile() {
  const router = useRouter();
  const { user, profile: currentProfile, loading: authLoading } = useAuth();
  const { loading, message, messageType, setFormState, handleError, setSuccess } = useFormState();
  
  const initRef = useRef(false);
  const { formData, updateField, resetForm } = useFormReset<ProfileFormData>({
    email: "",
    first_name: "",
    last_name: "",
    student_phone: "",
    student_email: "",
    parent_phone: "",
    parent_email: "",
    group: null,
    apply_role: null,
  });

  const { errors, validateForm, validateField } = useFormValidation({
    email: [commonRules.required("Email is required"), commonRules.email()],
    first_name: [commonRules.required("First name is required")],
    last_name: [commonRules.required("Last name is required")],
    group: [commonRules.required("Grade Group is required")],
    apply_role: [commonRules.required("Role application is required")],
    student_email: [commonRules.email("Please enter a valid student email")],
    parent_email: [commonRules.email("Please enter a valid parent email")],
  });

  useEffect(() => {
    if (!authLoading && currentProfile && !initRef.current) {
      initRef.current = true;
      resetForm({
        email: currentProfile.email || "",
        first_name: currentProfile.first_name || "",
        last_name: currentProfile.last_name || "",
        student_phone: currentProfile.student_phone || "",
        student_email: currentProfile.student_email || "",
        parent_phone: currentProfile.parent_phone || "",
        parent_email: currentProfile.parent_email || "",
        group: currentProfile.group,
        apply_role: currentProfile.apply_role,
      });
    }
  }, [authLoading, currentProfile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm(formData)) {
      return;
    }

    setFormState({ loading: true });

    try {
      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from("profiles")
        .update(formData)
        .eq("id", user.id);

      if (error) throw error;

      setSuccess("Profile updated successfully!");
      
    } catch (err) {
      handleError(err);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      await router.push("/login");
    } catch (err) {
      handleError(err);
    }
  };

  if (authLoading || !currentProfile) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="flex justify-center items-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-2xl mx-auto mt-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-white py-8 px-6 shadow-xl rounded-lg sm:px-10">
            <h1 className="text-3xl font-bold text-gray-900 text-center mb-8">Profile Settings</h1>
            
            <Form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Input
                  id="first_name"
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => {
                    updateField("first_name", e.target.value);
                    validateField("first_name", e.target.value);
                  }}
                  label="First Name"
                  required
                  error={errors.first_name?.[0]}
                />

                <Input
                  id="last_name"
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => {
                    updateField("last_name", e.target.value);
                    validateField("last_name", e.target.value);
                  }}
                  label="Last Name"
                  required
                  error={errors.last_name?.[0]}
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Input
                  id="student_phone"
                  type="tel"
                  value={formData.student_phone}
                  onChange={(e) => updateField("student_phone", e.target.value)}
                  label="Student Phone"
                  placeholder="(123) 456-7890"
                />

                <Input
                  id="student_email"
                  type="email"
                  value={formData.student_email}
                  onChange={(e) => {
                    updateField("student_email", e.target.value);
                    validateField("student_email", e.target.value);
                  }}
                  label="Student Email"
                  error={errors.student_email?.[0]}
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Input
                  id="parent_phone"
                  type="tel"
                  value={formData.parent_phone}
                  onChange={(e) => updateField("parent_phone", e.target.value)}
                  label="Parent Phone"
                  placeholder="(123) 456-7890"
                />

                <Input
                  id="parent_email"
                  type="email"
                  value={formData.parent_email}
                  onChange={(e) => {
                    updateField("parent_email", e.target.value);
                    validateField("parent_email", e.target.value);
                  }}
                  label="Parent Email"
                  error={errors.parent_email?.[0]}
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Select
                  id="group"
                  value={formData.group || ""}
                  onChange={(e) => {
                    updateField("group", e.target.value as SchoolGroup);
                    validateField("group", e.target.value);
                  }}
                  label="Grade Group"
                  options={GROUP_OPTIONS}
                  required
                  error={errors.group?.[0]}
                />

                <Select
                  id="apply_role"
                  value={formData.apply_role || ""}
                  onChange={(e) => {
                    updateField("apply_role", e.target.value as UserRole);
                    validateField("apply_role", e.target.value);
                  }}
                  label="Apply for Role"
                  options={ROLE_OPTIONS}
                  required
                  error={errors.apply_role?.[0]}
                />
              </div>

              <div className="flex justify-between items-center">
                <Button
                  type="button"
                  variant="danger"
                  onClick={handleLogout}
                  className="w-auto px-6"
                >
                  Sign Out
                </Button>

                <Button
                  type="submit"
                  loading={loading}
                  disabled={loading}
                  className="w-auto px-6"
                >
                  Save Changes
                </Button>
              </div>
            </Form>

            {message && messageType && <Message message={message} type={messageType} />}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
} 