import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  adminOnly?: boolean;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true,
  adminOnly = false,
  redirectTo 
}) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      if (!loading) {
        // Check if user session is still valid
        if (requireAuth && user) {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
              // Session expired, redirect to login
              navigate(redirectTo || '/auth');
              return;
            }
          } catch (error) {
            console.error('Auth check failed:', error);
            navigate(redirectTo || '/auth');
            return;
          }
        }

        if (requireAuth && !user) {
          // Store the attempted URL for redirect after login
          const returnUrl = location.pathname + location.search;
          if (adminOnly) {
            navigate(`/admin/login?returnUrl=${encodeURIComponent(returnUrl)}`);
          } else {
            navigate(`${redirectTo || '/auth'}?returnUrl=${encodeURIComponent(returnUrl)}`);
          }
        } else if (!requireAuth && user) {
          // Redirect authenticated users away from auth pages
          navigate('/dashboard/overview');
        }
        
        setAuthChecked(true);
      }
    };

    checkAuth();
  }, [user, loading, requireAuth, adminOnly, redirectTo, navigate, location]);

  if (loading || !authChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Handle admin-only routes with proper database verification
  if (adminOnly && user) {
    // Use proper admin verification instead of localStorage
    return <AdminProtectedRoute>{children}</AdminProtectedRoute>;
  }

  // Handle restaurant auth routes
  if (requireAuth && !user) {
    return null; // Will redirect in useEffect
  }

  // Handle public routes that should redirect authenticated users
  if (!requireAuth && user) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
};

// Secure admin protection using database verification
export const AdminProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [adminVerified, setAdminVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAdminAccess = async () => {
      if (!user) {
        const returnUrl = location.pathname + location.search;
        navigate(`/admin/login?returnUrl=${encodeURIComponent(returnUrl)}`);
        return;
      }

      try {
        // Use the new secure admin verification function
        const { data: isVerifiedAdmin, error } = await supabase.rpc('verify_admin_access', {
          p_user_id: user.id
        });

        if (error) {
          console.error('Admin verification error:', error);
          navigate('/admin/login');
          return;
        }

        if (!isVerifiedAdmin) {
          navigate('/admin/login');
          return;
        }

        setAdminVerified(true);
      } catch (error) {
        console.error('Admin verification failed:', error);
        navigate('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    verifyAdminAccess();
  }, [user, navigate, location]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!adminVerified) {
    return null;
  }

  return <>{children}</>;
};