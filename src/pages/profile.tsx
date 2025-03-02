import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";
import ProtectedRoute from "../components/ProtectedRoute";
import Layout from "../components/Layout";
import { Form, Select } from "../components/Form";
import { Input, Button, Message } from "../components/AuthCard";
import { useFormState } from "../hooks/useFormState";
import { useFormValidation, commonRules } from "../hooks/useFormValidation";
import { useFormReset } from "../hooks/useFormReset";

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string;
  student_phone: string;
  student_email: string;
  parent_phone: string;
  parent_email: string;
  group: "LES" | "UES" | "MHS" | "ADMIN" | null;
  role: "admin" | "staff" | "coordinator" | "tutor" | "tutee";
  apply_role: "admin" | "staff" | "coordinator" | "tutor" | "tutee" | null;
}

const GROUP_OPTIONS = [
  { value: "ADMIN", label: "Administrative" },
  { value: "LES", label: "Lower Elementary School" },
  { value: "UES", label: "Upper Elementary School" },
  { value: "MHS", label: "Middle High School" },
];

const ROLE_OPTIONS = [
  { value: "admin", label: "Administrator" },
  { value: "staff", label: "Staff" },
  { value: "coordinator", label: "Coordinator" },
  { value: "tutor", label: "Tutor" },
  { value: "tutee", label: "Student" },
];

export default function Profile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const { loading, message, messageType, setFormState, handleError, setSuccess } = useFormState();
  const router = useRouter();

  const { formData, setFormData, resetForm } = useFormReset<Partial<Profile>>({
    first_name: "",
    last_name: "",
    avatar_url: "",
    student_phone: "",
    student_email: "",
    parent_phone: "",
    parent_email: "",
    group: null,
    apply_role: null,
  });

  const { errors, validateForm, validateField } = useFormValidation({
    first_name: [commonRules.required("First name is required")],
    last_name: [commonRules.required("Last name is required")],
    group: [commonRules.required("Grade Group is required")],
    apply_role: [commonRules.required("Role application is required")],
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (error) throw error;
          setProfile(data);
          // Initialize form data with profile data
          const newProfile = {
            first_name: data.first_name || "",
            last_name: data.last_name || "",
            student_phone: data.student_phone || "",
            student_email: data.student_email || "",
            parent_phone: data.parent_phone || "",
            parent_email: data.parent_email || "",
            group: data.group || null,
            apply_role: data.apply_role || null,
          };
          setFormData(newProfile);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();
  }, [setFormData]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          student_phone: formData.student_phone,
          student_email: formData.student_email,
          parent_phone: formData.parent_phone,
          parent_email: formData.parent_email,
          group: formData.group,
          apply_role: formData.apply_role,
        })
        .eq("id", user.id);

      if (error) throw error;

      setSuccess("Profile updated successfully!");
      // Refresh profile data
      const { data: updatedProfile, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (fetchError) throw fetchError;
      setProfile(updatedProfile);
      
    } catch (error: unknown) {
      if (error instanceof Error) {
        handleError(error);
      } else {
        handleError(null, "An unexpected error occurred while updating your profile.");
      }
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  if (!profile) {
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
                    setFormData({ first_name: e.target.value });
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
                    setFormData({ last_name: e.target.value });
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
                  onChange={(e) => setFormData({ student_phone: e.target.value })}
                  label="Student Phone"
                  placeholder="(123) 456-7890"
                />

                <Input
                  id="student_email"
                  type="email"
                  value={formData.student_email}
                  onChange={(e) => {
                    setFormData({ student_email: e.target.value });
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
                  onChange={(e) => setFormData({ parent_phone: e.target.value })}
                  label="Parent Phone"
                  placeholder="(123) 456-7890"
                />

                <Input
                  id="parent_email"
                  type="email"
                  value={formData.parent_email}
                  onChange={(e) => {
                    setFormData({ parent_email: e.target.value });
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
                    setFormData({ group: e.target.value as Profile["group"] });
                    validateField("group", e.target.value);
                  }}
                  label="Grade Group"
                  required
                  error={errors.group?.[0]}
                  options={[
                    { value: "", label: "Select a group" },
                    ...GROUP_OPTIONS
                  ]}
                />

                <Select
                  id="apply_role"
                  value={formData.apply_role || ""}
                  onChange={(e) => {
                    setFormData({ apply_role: e.target.value as Profile["apply_role"] });
                    validateField("apply_role", e.target.value);
                  }}
                  label="Apply for Role"
                  required
                  error={errors.apply_role?.[0]}
                  options={[
                    { value: "", label: "Select a role to apply" },
                    ...ROLE_OPTIONS
                  ]}
                />
              </div>

              <div className="flex justify-center">
                <Button loading={loading} disabled={loading}>
                  Save Changes
                </Button>
              </div>
            </Form>

            {message && <Message message={message} type={messageType as "error" | "success"} />}

            <div className="mt-6 border-t border-gray-200 pt-6">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Current Role:</span>
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  {ROLE_OPTIONS.find(option => option.value === profile.role)?.label}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
} 