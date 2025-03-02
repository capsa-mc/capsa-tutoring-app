import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import ProtectedRoute from "../components/ProtectedRoute";
import Layout from "../components/Layout";
import { useAuth } from "../contexts/AuthContext";
import { Input, Message } from "../components/AuthCard";
import { Select } from "../components/Form";
import { FormMessageType } from "../types/form";

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  group: string;
  role: string;
  apply_role: string;
}

const ROLE_LEVELS = {
  admin: 1,
  staff: 2,
  coordinator: 3,
  tutor: 4,
  tutee: 4,
};

const GROUP_OPTIONS = [
  { value: "", label: "All Groups" },
  { value: "ADMIN", label: "Administrative" },
  { value: "LES", label: "Lower Elementary School" },
  { value: "UES", label: "Upper Elementary School" },
  { value: "MHS", label: "Middle High School" },
];

export default function RoleApprovals() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [message, setMessage] = useState<{ text: string; type: FormMessageType } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch current user's role and pending applications
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user) return;

        // Get current user's role
        const { data: userData, error: userError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (userError) throw userError;
        setCurrentUserRole(userData.role);

        // Only fetch if user has appropriate role
        if (!["admin", "staff", "coordinator"].includes(userData.role)) {
          setError("You don't have permission to access this page");
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error("Error:", error);
        setError("Failed to load data");
      }
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const fetchProfiles = useCallback(async () => {
    try {
      let query = supabase
        .from("profiles")
        .select("*")
        .not("first_name", "is", null)
        .not("last_name", "is", null)
        .not("role", "eq", "admin");

      if (selectedGroup) {
        query = query.eq("group", selectedGroup);
      }

      if (searchTerm) {
        query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error("Error fetching profiles:", error);
      setError("Failed to load profiles");
    }
  }, [selectedGroup, searchTerm]);

  // Effect hooks for fetching data
  useEffect(() => {
    if (!loading && currentUserRole) {
      fetchProfiles();
    }
  }, [loading, currentUserRole, fetchProfiles]);

  const isRoleDowngrade = (currentRole: string, applyRole: string) => {
    const currentLevel = ROLE_LEVELS[currentRole as keyof typeof ROLE_LEVELS] || 99;
    const applyLevel = ROLE_LEVELS[applyRole as keyof typeof ROLE_LEVELS] || 99;
    return applyLevel > currentLevel;
  };

  const handleApprove = async (profileId: string, currentRole: string, applyRole: string) => {
    try {
      // Check if this is a role downgrade
      if (isRoleDowngrade(currentRole, applyRole)) {
        const confirmed = window.confirm(
          `Warning: You are about to downgrade this user from ${currentRole} to ${applyRole}. Are you sure you want to continue?`
        );
        if (!confirmed) {
          return;
        }
      }

      const { error } = await supabase
        .from("profiles")
        .update({ 
          role: applyRole,
          apply_role: null 
        })
        .eq("id", profileId);

      if (error) throw error;

      setMessage({ text: "Role approved successfully", type: "success" });
      fetchProfiles();
    } catch (error) {
      console.error("Error approving role:", error);
      setMessage({ text: "Failed to approve role", type: "error" });
    }
  };

  if (loading) {
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

  if (error) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Message message={error} type="error" />
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Role Approval Management</h1>

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              label="Search"
            />

            <Select
              id="group-filter"
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              label="Filter by Group"
              options={GROUP_OPTIONS}
            />
          </div>

          {message && (
            <div className="mb-4">
              <Message message={message.text} type={message.type} />
            </div>
          )}

          <div className="bg-white shadow-xl rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Group
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applying For
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {profiles
                  .slice((currentPage - 1) * 10, currentPage * 10)
                  .map((profile) => (
                  <tr key={profile.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {profile.last_name}, {profile.first_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {GROUP_OPTIONS.find(g => g.value === profile.group)?.label}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap capitalize">
                      {profile.role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap capitalize">
                      {profile.apply_role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleApprove(profile.id, profile.role, profile.apply_role)}
                        className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white ${
                          isRoleDowngrade(profile.role, profile.apply_role)
                            ? "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500"
                            : "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                        } focus:outline-none focus:ring-2 focus:ring-offset-2`}
                      >
                        {isRoleDowngrade(profile.role, profile.apply_role) ? "Downgrade" : "Approve"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {profiles.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No pending role applications found
            </div>
          )}

          {profiles.length > 0 && (
            <div className="mt-4 flex justify-center">
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                {Array.from({ length: Math.ceil(profiles.length / 10) }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPage(index + 1)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      currentPage === index + 1
                        ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                        : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </nav>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
} 