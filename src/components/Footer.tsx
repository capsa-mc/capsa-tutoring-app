import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-8 bg-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
        <div className="flex justify-center space-x-6 md:order-2">
          <Link href="/about" className="text-gray-400 hover:text-gray-500">
            About
          </Link>
          <Link href="/contact" className="text-gray-400 hover:text-gray-500">
            Contact
          </Link>
          <Link href="/privacy" className="text-gray-400 hover:text-gray-500">
            Privacy
          </Link>
        </div>
        <div className="mt-8 md:mt-0 md:order-1">
          <p className="text-center text-base text-gray-400">
            &copy; {new Date().getFullYear()} CAPSA-MC Tutoring. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
} 