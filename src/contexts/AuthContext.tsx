import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { clearAllOfflineData } from '@/lib/offlineDb';

type AppRole = 'estudiante' | 'docente' | 'director' | 'subdirector' | 'especialista' | 'padre' | 'administrador';

interface Profile {
  id: string;
  dni: string;
  nombre_completo: string;
  institucion_id: string | null;
  grado_seccion_id: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  mustChangePassword: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata: Record<string, string>) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  primaryRole: AppRole | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  // Single loading flag: true until auth + profile/roles are fully resolved
  const [loading, setLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const loadingRef = React.useRef(true);

  const fetchProfileAndRoles = useCallback(async (userId: string) => {
    try {
      const [profileRes, rolesRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', userId).single(),
        supabase.from('user_roles').select('role').eq('user_id', userId),
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data as Profile);
        setMustChangePassword(!!(profileRes.data as any).must_change_password);
      }

      if (rolesRes.data) {
        setRoles(rolesRes.data.map(r => r.role as AppRole));
      }
    } catch (err) {
      console.error('Error fetching profile/roles:', err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          // Fetch profile/roles BEFORE setting loading=false
          await fetchProfileAndRoles(currentUser.id);
        } else {
          setProfile(null);
          setRoles([]);
          setMustChangePassword(false);
        }

        if (mounted) {
          setLoading(false);
          loadingRef.current = false;
        }
      }
    );

    // Safety timeout for stale sessions
    const timeout = setTimeout(() => {
      if (mounted && loadingRef.current) {
        console.warn('Auth session check timed out, clearing stale session');
        supabase.auth.signOut().catch(() => {});
        setSession(null);
        setUser(null);
        setProfile(null);
        setRoles([]);
        setLoading(false);
        loadingRef.current = false;
      }
    }, 10000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, metadata: Record<string, string>) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    try {
      await clearAllOfflineData();
    } catch (e) {
      console.warn('Failed to clear offline data on logout');
    }
    await supabase.auth.signOut();
    setProfile(null);
    setRoles([]);
    setMustChangePassword(false);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfileAndRoles(user.id);
  };

  const roleHierarchy: AppRole[] = ['administrador', 'especialista', 'director', 'subdirector', 'docente', 'padre', 'estudiante'];
  const primaryRole = roles.length > 0
    ? roleHierarchy.find(r => roles.includes(r)) || roles[0]
    : null;

  return (
    <AuthContext.Provider value={{ user, session, profile, roles, loading, mustChangePassword, signIn, signUp, signOut, refreshProfile, primaryRole }}>
      {children}
    </AuthContext.Provider>
  );
};
