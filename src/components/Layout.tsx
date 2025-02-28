import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

interface LayoutProps {
  children: ReactNode;
  showAuthButtons?: boolean;
  className?: string;
}

export default function Layout({ 
  children, 
  showAuthButtons = true,
  className = "min-h-screen bg-gradient-to-b from-white to-blue-50"
}: LayoutProps) {
  return (
    <div className={className}>
      <Navbar showAuthButtons={showAuthButtons} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </main>
      <Footer />
    </div>
  );
} 