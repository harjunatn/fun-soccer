// AuthContext.tsx (Optimized Structure Summary — Copy for Comparison)

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

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

  const lastKnownAdminStatus = useRef<boolean | null>(null);
  const mountedRef = useRef(true);

  // Query admin role from DB (defined first, used by updateUserFromSession)
  const checkAdminStatus = useCallback(async (userId: string): Promise<boolean> => {
    const query = supabase.from('admin_users').select('id').eq('user_id', userId).maybeSingle();

    const result = await Promise.race([
      query,
      new Promise<{ error: { code?: string; message?: string } }>((_, reject) => 
        setTimeout(() => reject(new Error('timeout')), 5000)
      ),
    ]) as { data: { id: string } | null; error: { code?: string; message?: string } | null };

    if (result.error) {
      if (result.error.code === 'PGRST116') return false;
      throw result.error;
    }
    return !!result.data;
  }, []);

  // Session → user + admin logic centralized (defined before useEffect)
  const updateUserFromSession = useCallback(async (currentSession: Session | null) => {
    if (!currentSession?.user) {
      setUser(null);
      setIsAdmin(false);
      lastKnownAdminStatus.current = null;
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const adminStatus = await checkAdminStatus(currentSession.user.id);

      lastKnownAdminStatus.current = adminStatus;
      setIsAdmin(adminStatus);

      setUser({
        email: currentSession.user.email!,
        isAdmin: adminStatus,
      });
    } catch {
      // fallback to last known admin status
      const fallback = lastKnownAdminStatus.current ?? false;
      setIsAdmin(fallback);
      setUser({
        email: currentSession.user.email!,
        isAdmin: fallback,
      });
    } finally {
      setLoading(false);
    }
  }, [checkAdminStatus]);

  // Initialize + listen for session changes
  useEffect(() => {
    mountedRef.current = true;

    const init = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setSession(null);
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      setSession(data.session);
      await updateUserFromSession(data.session);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mountedRef.current) return;

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setSession(null);
          setIsAdmin(false);
          lastKnownAdminStatus.current = null;
          setLoading(false);
          return;
        }

        setSession(newSession);
        await updateUserFromSession(newSession);
      }
    );

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [updateUserFromSession]);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) return { success: false, error: error?.message || 'Login failed' };

    setSession(data.session);
    await updateUserFromSession(data.session);

    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    lastKnownAdminStatus.current = null;
  };

  return (
    <AuthContext.Provider value={{ user, session, login, logout, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}