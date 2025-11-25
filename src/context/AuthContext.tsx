import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      
      setSession(session);
      if (session?.user) {
        await checkAdminStatus(session.user.id, session.user.email || undefined);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    }).catch((error) => {
      console.error('Error getting session:', error);
      if (mounted) {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      
      setSession(session);
      if (session?.user) {
        await checkAdminStatus(session.user.id, session.user.email || undefined);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const checkAdminStatus = async (userId: string, userEmail?: string) => {
    try {
      // Check if user is admin by querying admin_users table
      // Add timeout to prevent hanging (3 seconds)
      const queryPromise = supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Admin check timeout')), 3000)
      );
      
      const result = await Promise.race([queryPromise, timeoutPromise]) as any;
      const { data, error } = result;

      // If table doesn't exist or other error, just set user as non-admin but still logged in
      if (error) {
        // PGRST116 = no rows returned (user is not admin) - this is OK
        if (error.code === 'PGRST116') {
          setIsAdmin(false);
          if (userEmail) {
            setUser({
              email: userEmail,
              isAdmin: false,
            });
          }
          return;
        }
        // Other errors (table doesn't exist, RLS issue, etc.)
        setIsAdmin(false);
        if (userEmail) {
          setUser({
            email: userEmail,
            isAdmin: false,
          });
        }
        return;
      }

      const adminStatus = !!data;
      setIsAdmin(adminStatus);

      if (userEmail) {
        setUser({
          email: userEmail,
          isAdmin: adminStatus,
        });
      }
    } catch (error: any) {
      // Still set user as logged in, just not as admin
      setIsAdmin(false);
      if (userEmail) {
        setUser({
          email: userEmail,
          isAdmin: false,
        });
      }
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
      }

      if (data.session && data.user) {
        // Immediately update session state
        setSession(data.session);
        setLoading(false);
        
        // Check admin status with timeout protection
        try {
          await Promise.race([
            checkAdminStatus(data.user.id, data.user.email || undefined),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
          ]);
        } catch {
          // Set as non-admin if check fails
          setIsAdmin(false);
          if (data.user.email) {
            setUser({
              email: data.user.email,
              isAdmin: false,
            });
          }
        }
        
        // Wait for auth state change listener to also fire
        // This ensures the state is fully updated
        await new Promise(resolve => setTimeout(resolve, 300));
        
        return { success: true };
      }

      return { success: false, error: 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setIsAdmin(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, login, logout, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
