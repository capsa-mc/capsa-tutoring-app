import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

type UserRole = "admin" | "staff" | "coordinator" | "tutor" | "tutee";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/login?returnUrl=${router.asPath}`);
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setRoleLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        setUserRole(data.role as UserRole);
        console.log("ProtectedRoute - User role:", data.role);
        console.log("ProtectedRoute - Current path:", router.pathname);
        
        // 移除对 tutor 和 tutee 角色的访问限制
        // 所有用户都可以访问所有受保护的路由
      } catch (error) {
        console.error("Error fetching user role:", error);
      } finally {
        setRoleLoading(false);
      }
    };

    if (user) {
      fetchUserRole();
    }
  }, [user, router]);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return user ? <>{children}</> : null;
} 