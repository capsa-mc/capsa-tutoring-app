import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabaseClient";
import Logo from "./Logo";

type UserRole = "admin" | "staff" | "coordinator" | "tutor" | "tutee";

interface NavbarProps {
  showAuthButtons?: boolean;
}

interface NavLinkProps {
  href: string;
  currentPath: string;
  children: React.ReactNode;
  isMobile?: boolean;
}

const NavLink = ({ href, currentPath, children, isMobile = false }: NavLinkProps) => {
  const baseClasses = "font-medium";
  const mobileClasses = "block px-3 py-2 rounded-md text-base";
  const desktopClasses = "text-base";
  
  const isActive = currentPath === href;
  const activeClasses = isMobile ? "bg-blue-50 text-blue-700" : "text-blue-700";
  const inactiveClasses = "text-gray-500 hover:text-gray-900" + (isMobile ? " hover:bg-gray-50" : "");
  
  return (
    <Link
      href={href}
      className={`${baseClasses} ${isMobile ? mobileClasses : desktopClasses} ${
        isActive ? activeClasses : inactiveClasses
      }`}
    >
      {children}
    </Link>
  );
};

export default function Navbar({ showAuthButtons = true }: NavbarProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
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
        setUserRole(data.role as UserRole);
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
      await router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const isProtectedRoute = !["", "/login", "/register"].includes(router.pathname);

  useEffect(() => {
    console.log("Current path:", router.pathname);
    console.log("Is protected route:", isProtectedRoute);
    console.log("Current user role state:", userRole);
  }, [userRole, router.pathname, isProtectedRoute]);

  const renderNavLinks = (isMobile = false) => {
    return (
      <>
        <NavLink href="/profile" currentPath={router.pathname} isMobile={isMobile}>
          Profile
        </NavLink>
        <>
          <NavLink href="/pair-management" currentPath={router.pathname} isMobile={isMobile}>
            Pair Management
          </NavLink>
          <NavLink href="/role-approvals" currentPath={router.pathname} isMobile={isMobile}>
            Role Approvals
          </NavLink>
        </>
      </>
    );
  };

  const renderAuthButtons = (isMobile = false) => {
    const buttonClasses = isMobile
      ? "block w-full px-3 py-2 rounded-md text-base font-medium"
      : "inline-flex items-center justify-center px-4 py-2 rounded-md text-base font-medium";

    return (
      <>
        <Link
          href="/login"
          className={`${buttonClasses} text-[#2563eb] hover:text-[#1d4ed8] ${
            !isMobile && "hover:bg-blue-50"
          }`}
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className={`${buttonClasses} border border-[#2563eb] text-[#2563eb] bg-white hover:bg-blue-50`}
        >
          Sign up
        </Link>
      </>
    );
  };

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
              {renderNavLinks()}
            </div>
          )}

          {!isProtectedRoute && showAuthButtons && (
            <div className="flex items-center space-x-4">
              {renderAuthButtons()}
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
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          aria-expanded={isMenuOpen}
        >
          <span className="sr-only">Toggle menu</span>
          <svg
            className="h-6 w-6"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={
                isMenuOpen
                  ? "M6 18L18 6M6 6l12 12"
                  : "M4 6h16M4 12h16M4 18h16"
              }
            />
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {isProtectedRoute && user && (
              <div className="space-y-1">
                {renderNavLinks(true)}
              </div>
            )}

            {!isProtectedRoute && showAuthButtons && (
              <div className="space-y-1">
                {renderAuthButtons(true)}
              </div>
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