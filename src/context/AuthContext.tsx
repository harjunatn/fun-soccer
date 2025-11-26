import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
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
  // Track last known admin status to preserve on query errors
  const lastKnownAdminStatus = useRef<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (!mounted) return;
      
      if (error) {
        console.error('Error getting session:', error);
        setSession(null);
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      
      setSession(session);
      if (session?.user) {
        // Check admin status before setting loading to false
        await checkAdminStatus(session.user.id, session.user.email || undefined);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    }).catch((error) => {
      console.error('Error in getSession:', error);
      if (mounted) {
        setSession(null);
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      // Handle different auth events
      if (event === 'TOKEN_REFRESHED') {
        // Token was refreshed - just update session, don't clear user state
        setSession(session);
        // Optionally re-check admin status, but preserve state if it fails
        if (session?.user) {
          try {
            await Promise.race([
              checkAdminStatus(session.user.id, session.user.email || undefined, true),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
            ]);
          } catch {
            // If admin check fails during refresh, keep current state
            // Don't clear user or isAdmin - they're still valid
          }
        }
        return;
      }
      
      if (event === 'SIGNED_OUT') {
        // User explicitly signed out
        setSession(null);
        setUser(null);
        setIsAdmin(false);
        lastKnownAdminStatus.current = null;
        setLoading(false);
        return;
      }
      
      // For SIGNED_IN, USER_UPDATED, etc.
      setSession(session);
      if (session?.user) {
        // Check admin status - this will update isAdmin and user state
        await checkAdminStatus(session.user.id, session.user.email || undefined);
      } else {
        // No session - clear all auth state
        setUser(null);
        setIsAdmin(false);
      }
      // Only set loading to false after all state updates are complete
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const checkAdminStatus = async (userId: string, userEmail?: string, preserveState = false) => {
    try {
      // Check if user is admin by querying admin_users table
      // Increase timeout to 5 seconds to handle slower connections
      const queryPromise = supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Admin check timeout')), 5000)
      );
      
      const result = await Promise.race([queryPromise, timeoutPromise]) as { data: unknown; error: { code?: string; message?: string } | null };
      const { data, error } = result;

      if (error) {
        // PGRST116 = no rows returned (user is not admin) - this is definitive
        if (error.code === 'PGRST116') {
          // User is definitely not an admin
          lastKnownAdminStatus.current = false;
          if (!preserveState) {
            setIsAdmin(false);
            if (userEmail) {
              setUser({
                email: userEmail,
                isAdmin: false,
              });
            }
          }
          return;
        }
        
        // Other errors (RLS issue, network error, timeout, etc.)
        // Preserve last known admin status if we have one
        console.warn('Admin check query failed:', error.code, error.message);
        if (preserveState || lastKnownAdminStatus.current !== null) {
          // Keep current state - don't clear admin status on transient errors
          // Only update if we have a last known status
          if (lastKnownAdminStatus.current !== null) {
            setIsAdmin(lastKnownAdminStatus.current);
            if (userEmail) {
              setUser({
                email: userEmail,
                isAdmin: lastKnownAdminStatus.current,
              });
            }
          }
          return;
        }
        
        // First check and it failed - default to non-admin
        if (!preserveState) {
          lastKnownAdminStatus.current = false;
          setIsAdmin(false);
          if (userEmail) {
            setUser({
              email: userEmail,
              isAdmin: false,
            });
          }
        }
        return;
      }

      // Successfully got a result
      const adminStatus = !!data;
      lastKnownAdminStatus.current = adminStatus;
      setIsAdmin(adminStatus);

      if (userEmail) {
        setUser({
          email: userEmail,
          isAdmin: adminStatus,
        });
      }
    } catch (error) {
      // Network error, timeout, etc.
      console.warn('Admin check exception:', error);
      // Preserve last known admin status if we have one
      if (preserveState || lastKnownAdminStatus.current !== null) {
        if (lastKnownAdminStatus.current !== null) {
          setIsAdmin(lastKnownAdminStatus.current);
          if (userEmail) {
            setUser({
              email: userEmail,
              isAdmin: lastKnownAdminStatus.current,
            });
          }
        }
        return;
      }
      
      // First check and it failed - default to non-admin
      if (!preserveState) {
        lastKnownAdminStatus.current = false;
        setIsAdmin(false);
        if (userEmail) {
          setUser({
            email: userEmail,
            isAdmin: false,
          });
        }
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
      lastKnownAdminStatus.current = null;
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
