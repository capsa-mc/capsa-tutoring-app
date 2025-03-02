import Link from "next/link";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import Logo from "./Logo";
import { useAuth } from "../contexts/AuthContext";
import { useEffect, useState } from "react";

interface NavbarProps {
  showAuthButtons?: boolean;
}

export default function Navbar({ showAuthButtons = true }: NavbarProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        setUserRole(data.role);
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    };

    fetchUserRole();
  }, [user]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const isProtectedRoute = router.pathname !== "/" && router.pathname !== "/login" && router.pathname !== "/register";

  // Check if user has permission to access specific pages
  const canAccessPairManagement = userRole && ["admin", "staff", "coordinator"].includes(userRole);
  const canAccessRoleApprovals = userRole && ["admin", "staff", "coordinator"].includes(userRole);

  return (
    <nav className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="h-16 flex items-center justify-between">
        <div className="flex items-center">
          <Logo />
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex md:items-center">
          {isProtectedRoute && user && (
            <div className="ml-8 flex space-x-4">
              <Link
                href="/profile"
                className={`text-base font-medium ${
                  router.pathname === "/profile"
                    ? "text-blue-700"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Profile
              </Link>
              {canAccessPairManagement && (
                <Link
                  href="/pair-management"
                  className={`text-base font-medium ${
                    router.pathname === "/pair-management"
                      ? "text-blue-700"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Pair Management
                </Link>
              )}
              {canAccessRoleApprovals && (
                <Link
                  href="/role-approvals"
                  className={`text-base font-medium ${
                    router.pathname === "/role-approvals"
                      ? "text-blue-700"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Role Approvals
                </Link>
              )}
            </div>
          )}

          {!isProtectedRoute && showAuthButtons && (
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-base font-medium text-[#2563eb] hover:text-[#1d4ed8]"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-4 py-2 border border-[#2563eb] rounded-md shadow-sm text-base font-medium text-[#2563eb] bg-white hover:bg-blue-50"
              >
                Sign up
              </Link>
            </div>
          )}

          {isProtectedRoute && user && (
            <div className="flex items-center space-x-4 ml-8">
              {userRole && (
                <span className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 rounded-full">
                  {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                </span>
              )}
              <button
                onClick={handleSignOut}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Sign out
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          >
            <span className="sr-only">Open main menu</span>
            {!isMenuOpen ? (
              <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            ) : (
              <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {isProtectedRoute && user && (
              <>
                <Link
                  href="/profile"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    router.pathname === "/profile"
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  Profile
                </Link>
                {canAccessPairManagement && (
                  <Link
                    href="/pair-management"
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      router.pathname === "/pair-management"
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    Pair Management
                  </Link>
                )}
                {canAccessRoleApprovals && (
                  <Link
                    href="/role-approvals"
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      router.pathname === "/role-approvals"
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    Role Approvals
                  </Link>
                )}
              </>
            )}

            {!isProtectedRoute && showAuthButtons && (
              <>
                <Link
                  href="/login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-[#2563eb] hover:bg-gray-50"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="block px-3 py-2 rounded-md text-base font-medium text-[#2563eb] hover:bg-gray-50"
                >
                  Sign up
                </Link>
              </>
            )}

            {isProtectedRoute && user && (
              <div className="pt-4 pb-3 border-t border-gray-200">
                {userRole && (
                  <div className="px-3 py-2">
                    <span className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 rounded-full">
                      {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                    </span>
                  </div>
                )}
                <button
                  onClick={handleSignOut}
                  className="mt-2 block w-full px-3 py-2 rounded-md text-base font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
} 