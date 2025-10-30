import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: string | null;
  isAdmin: boolean;
  isRestaurant: boolean;
  isAuthenticated: boolean;
  checkRole: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isRestaurant, setIsRestaurant] = useState(false);
  const { toast } = useToast();

  const checkRole = async () => {
    if (!user) {
      setUserRole(null);
      setIsAdmin(false);
      setIsRestaurant(false);
      return;
    }

    try {
      // Check user role from user_roles table
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleError && roleError.code !== 'PGRST116') {
        return;
      }

      const role = roleData?.role || null;
      setUserRole(role);
      setIsAdmin(role === 'admin' || role === 'super_admin');
      setIsRestaurant(role === 'restaurant' || role === 'restaurant_manager');

      // Also check if user is a restaurant owner
      if (!role || role === 'restaurant') {
        const { data: restaurantData } = await supabase
          .from('restaurants')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (restaurantData) {
          setIsRestaurant(true);
          if (!role) setUserRole('restaurant');
        }
      }
    } catch (error) {
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setSession(null);
      setUserRole(null);
      setIsAdmin(false);
      setIsRestaurant(false);
      
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account",
      });
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message || "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => {
            checkRole();
          }, 0);
        } else {
          setUserRole(null);
          setIsAdmin(false);
          setIsRestaurant(false);
        }

        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await checkRole();
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      userRole, 
      isAdmin, 
      isRestaurant,
      isAuthenticated,
      checkRole,
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};