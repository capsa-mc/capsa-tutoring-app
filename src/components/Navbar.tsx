import Link from "next/link";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import Logo from "./Logo";
import { useAuth } from "../contexts/AuthContext";

interface NavbarProps {
  showAuthButtons?: boolean;
}

export default function Navbar({ showAuthButtons = true }: NavbarProps) {
  const router = useRouter();
  const { user } = useAuth();

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

  return (
    <nav className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <Logo />
      
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
        <button
          onClick={handleSignOut}
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Sign out
        </button>
      )}
    </nav>
  );
} 