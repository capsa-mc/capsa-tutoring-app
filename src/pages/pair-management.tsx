import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import ProtectedRoute from "../components/ProtectedRoute";
import Layout from "../components/Layout";
import { useAuth } from "../contexts/AuthContext";
import { Input, Message } from "../components/AuthCard";
import { Select } from "../components/Form";

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  group: string;
  role: string;
}

interface Pair {
  id: number;
  tutor_id: string;
  tutee_id: string;
}

const GROUP_OPTIONS = [
  { value: "", label: "All Groups" },
  { value: "ADMIN", label: "Administrative" },
  { value: "LES", label: "Lower Elementary School" },
  { value: "UES", label: "Upper Elementary School" },
  { value: "MHS", label: "Middle High School" },
];

export default function PairManagement() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  // States for tutors
  const [tutors, setTutors] = useState<Profile[]>([]);
  const [selectedTutor, setSelectedTutor] = useState<Profile | null>(null);
  const [tutorSearchTerm, setTutorSearchTerm] = useState("");
  const [tutorGroup, setTutorGroup] = useState("");

  // States for tutees
  const [tutees, setTutees] = useState<Profile[]>([]);
  const [tuteeSearchTerm, setTuteeSearchTerm] = useState("");
  const [tuteeGroup, setTuteeGroup] = useState("");

  // State for existing pairs
  const [existingPairs, setExistingPairs] = useState<Pair[]>([]);

  // Fetch current user's role and check authorization
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        if (!user) return;

        const { data: userData, error: userError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (userError) throw userError;
        setCurrentUserRole(userData.role);

        // Only allow access to admin, staff, and coordinator
        if (!["admin", "staff", "coordinator"].includes(userData.role)) {
          setError("You don't have permission to access this page");
          setLoading(false);
          return;
        }

        setLoading(false);
      } catch (error) {
        console.error("Error:", error);
        setError("Failed to load user data");
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  // Fetch tutors based on filters
  const fetchTutors = useCallback(async () => {
    try {
      let query = supabase
        .from("profiles")
        .select("id, first_name, last_name, group, role")
        .eq("role", "tutor")
        .not("first_name", "is", null)
        .not("last_name", "is", null);

      if (tutorGroup) {
        query = query.eq("group", tutorGroup);
      }

      if (tutorSearchTerm) {
        query = query.or(`first_name.ilike.%${tutorSearchTerm}%,last_name.ilike.%${tutorSearchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTutors(data || []);
    } catch (error) {
      console.error("Error fetching tutors:", error);
      setError("Failed to load tutors");
    }
  }, [tutorGroup, tutorSearchTerm]);

  // Fetch tutees based on filters
  const fetchTutees = useCallback(async () => {
    try {
      let query = supabase
        .from("profiles")
        .select("id, first_name, last_name, group, role")
        .eq("role", "tutee")
        .not("first_name", "is", null)
        .not("last_name", "is", null);

      if (tuteeGroup) {
        query = query.eq("group", tuteeGroup);
      }

      if (tuteeSearchTerm) {
        query = query.or(`first_name.ilike.%${tuteeSearchTerm}%,last_name.ilike.%${tuteeSearchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTutees(data || []);
    } catch (error) {
      console.error("Error fetching tutees:", error);
      setError("Failed to load tutees");
    }
  }, [tuteeGroup, tuteeSearchTerm]);

  // Fetch existing pairs
  const fetchExistingPairs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("pair")
        .select("*");

      if (error) throw error;
      setExistingPairs(data || []);
    } catch (error) {
      console.error("Error fetching pairs:", error);
      setError("Failed to load existing pairs");
    }
  }, []);

  // Effect hooks for fetching data
  useEffect(() => {
    if (!loading && currentUserRole) {
      fetchTutors();
      fetchTutees();
      fetchExistingPairs();
    }
  }, [tutorSearchTerm, tutorGroup, tuteeSearchTerm, tuteeGroup, loading, currentUserRole, fetchTutors, fetchTutees, fetchExistingPairs]);

  // Create a new pair
  const handleCreatePair = async (tutorId: string, tuteeId: string) => {
    try {
      // Check if pair already exists
      const existingPair = existingPairs.find(
        p => (p.tutor_id === tutorId && p.tutee_id === tuteeId)
      );

      if (existingPair) {
        setMessage({
          text: "This tutor and tutee are already paired",
          type: "error"
        });
        return;
      }

      const { error } = await supabase
        .from("pair")
        .insert([{ tutor_id: tutorId, tutee_id: tuteeId }]);

      if (error) throw error;

      setMessage({
        text: "Pair created successfully",
        type: "success"
      });

      // Refresh pairs
      fetchExistingPairs();
    } catch (error) {
      console.error("Error creating pair:", error);
      setMessage({
        text: "Failed to create pair",
        type: "error"
      });
    }
  };

  // Delete a pair
  const handleDeletePair = async (pairId: number) => {
    try {
      const { error } = await supabase
        .from("pair")
        .delete()
        .eq("id", pairId);

      if (error) throw error;

      setMessage({
        text: "Pair deleted successfully",
        type: "success"
      });

      // Refresh pairs
      fetchExistingPairs();
    } catch (error) {
      console.error("Error deleting pair:", error);
      setMessage({
        text: "Failed to delete pair",
        type: "error"
      });
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Pair Management</h1>

          {/* Tutor Selection Section */}
          <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Tutor</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-4">
              <Input
                id="tutorSearch"
                type="text"
                value={tutorSearchTerm}
                onChange={(e) => setTutorSearchTerm(e.target.value)}
                label="Search Tutor"
                placeholder="Enter tutor name"
              />
              <Select
                id="tutorGroup"
                value={tutorGroup}
                onChange={(e) => setTutorGroup(e.target.value)}
                label="Filter by Group"
                options={GROUP_OPTIONS}
              />
            </div>
            <div className="mt-4 space-y-3">
              {tutors.map((tutor) => (
                <div
                  key={tutor.id}
                  className={`p-4 rounded-lg border transform transition-all duration-200 ease-in-out ${
                    selectedTutor?.id === tutor.id
                      ? "border-blue-500 bg-blue-50 shadow-md scale-[1.02]"
                      : "border-gray-200 hover:border-blue-300 hover:shadow-sm hover:scale-[1.01]"
                  } cursor-pointer`}
                  onClick={() => setSelectedTutor(tutor)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-grow space-y-1">
                      <p className="font-medium text-gray-900 text-lg leading-tight">{`${tutor.last_name}, ${tutor.first_name}`}</p>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{tutor.group}</span>
                        {existingPairs.some(p => p.tutor_id === tutor.id) ? (
                          <span className="px-2 py-0.5 text-sm font-medium bg-green-100 text-green-800 rounded-full">
                            Has Tutees
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-sm font-medium bg-yellow-100 text-yellow-800 rounded-full">
                            No Tutees
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tutee Selection Section */}
          {selectedTutor && (
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Select Tutees for {selectedTutor.first_name} {selectedTutor.last_name}
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-4">
                <Input
                  id="tuteeSearch"
                  type="text"
                  value={tuteeSearchTerm}
                  onChange={(e) => setTuteeSearchTerm(e.target.value)}
                  label="Search Tutee"
                  placeholder="Enter tutee name"
                />
                <Select
                  id="tuteeGroup"
                  value={tuteeGroup}
                  onChange={(e) => setTuteeGroup(e.target.value)}
                  label="Filter by Group"
                  options={GROUP_OPTIONS}
                />
              </div>
              <div className="mt-4 space-y-3">
                {tutees.map((tutee) => {
                  const existingPair = existingPairs.find(
                    p => p.tutor_id === selectedTutor.id && p.tutee_id === tutee.id
                  );
                  const isPairedWithOther = existingPairs.some(p => p.tutee_id === tutee.id && p.tutor_id !== selectedTutor.id);
                  const isNotPaired = !existingPairs.some(p => p.tutee_id === tutee.id);

                  return (
                    <div
                      key={tutee.id}
                      className={`p-4 rounded-lg border transform transition-all duration-200 ease-in-out ${
                        existingPair
                          ? "border-green-200 bg-green-50 hover:border-green-300"
                          : isPairedWithOther
                          ? "border-red-200 bg-red-50"
                          : "border-gray-200 hover:border-blue-300"
                      } hover:shadow-sm`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-grow min-w-0 space-y-1">
                          <p className="font-medium text-gray-900 text-lg leading-tight truncate">{`${tutee.last_name}, ${tutee.first_name}`}</p>
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{tutee.group}</span>
                            {isPairedWithOther && (
                              <span className="px-2 py-0.5 text-sm font-medium bg-red-100 text-red-800 rounded-full whitespace-nowrap">
                                Paired with another tutor
                              </span>
                            )}
                            {isNotPaired && (
                              <span className="px-2 py-0.5 text-sm font-medium bg-yellow-100 text-yellow-800 rounded-full">
                                Not paired
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0 ml-4">
                          {existingPair ? (
                            <button
                              type="button"
                              onClick={() => handleDeletePair(existingPair.id)}
                              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200 hover:scale-105 transform"
                            >
                              Remove Pair
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleCreatePair(selectedTutor.id, tutee.id)}
                              className={`inline-flex items-center px-3 py-1.5 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 hover:scale-105 transform ${
                                isPairedWithOther
                                  ? "bg-gray-400 cursor-not-allowed"
                                  : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                              }`}
                              disabled={isPairedWithOther}
                            >
                              Add Pair
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {message && (
            <div className="mt-6">
              <Message message={message.text} type={message.type} />
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
} 