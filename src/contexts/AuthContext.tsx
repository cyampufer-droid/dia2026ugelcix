import React, { createContext, useContext, useState, useEffect } from 'react';
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
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata: Record<string, string>) => Promise<void>;
  signOut: () => Promise<void>;
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
  const [loading, setLoading] = useState(true);

  const fetchProfileAndRoles = async (userId: string) => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (profileData) {
        setProfile(profileData as Profile);
      }

      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (rolesData) {
        setRoles(rolesData.map(r => r.role as AppRole));
      }
    } catch (err) {
      console.error('Error fetching profile/roles:', err);
    }
  };

  // Fetch profile/roles whenever user changes
  useEffect(() => {
    if (user) {
      fetchProfileAndRoles(user.id);
    } else {
      setProfile(null);
      setRoles([]);
    }
  }, [user]);

  useEffect(() => {
    let initialSessionHandled = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        initialSessionHandled = true;
        setLoading(false);
      }
    );

    const timeout = setTimeout(() => {
      if (!initialSessionHandled) {
        console.warn('Auth session check timed out, clearing stale session');
        supabase.auth.signOut().catch(() => {});
        setSession(null);
        setUser(null);
        setLoading(false);
      }
    }, 5000);

    return () => {
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
    // Clear offline data on logout to prevent data exposure
    try {
      await clearAllOfflineData();
    } catch (e) {
      console.warn('Failed to clear offline data on logout');
    }
    await supabase.auth.signOut();
    setProfile(null);
    setRoles([]);
  };

  const roleHierarchy: AppRole[] = ['administrador', 'especialista', 'director', 'subdirector', 'docente', 'padre', 'estudiante'];
  const primaryRole = roles.length > 0
    ? roleHierarchy.find(r => roles.includes(r)) || roles[0]
    : null;

  return (
    <AuthContext.Provider value={{ user, session, profile, roles, loading, signIn, signUp, signOut, primaryRole }}>
      {children}
    </AuthContext.Provider>
  );
};
