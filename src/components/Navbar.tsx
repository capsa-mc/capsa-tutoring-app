import Link from "next/link";
import Logo from "./Logo";

interface NavbarProps {
  showAuthButtons?: boolean;
}

export default function Navbar({ showAuthButtons = true }: NavbarProps) {
  return (
    <nav className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <Logo />
      {showAuthButtons && (
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
    </nav>
  );
} 