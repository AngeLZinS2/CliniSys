import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'staff' | 'patient';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  cpf?: string;
  phone?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: 'staff' | 'patient') => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (session?.user) {
          // Defer database calls with setTimeout to avoid deadlock
          setTimeout(() => {
            loadUserData(session.user);
          }, 0);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserData(session.user);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (supabaseUser: SupabaseUser) => {
    try {
      // Get profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      // Get user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', supabaseUser.id)
        .single();

      if (profile && roleData) {
        setUser({
          id: supabaseUser.id,
          name: profile.name,
          email: supabaseUser.email!,
          role: roleData.role as UserRole,
          cpf: profile.cpf || undefined,
          phone: profile.phone || undefined,
          avatar: profile.avatar || undefined,
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, role: 'staff' | 'patient') => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    
    // Check if user has the correct role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', data.user.id)
      .single();

    if (!roleData) {
      await supabase.auth.signOut();
      throw new Error('Usuário sem role definido');
    }

    const userRole = roleData.role as UserRole;
    const isStaff = ['admin', 'doctor', 'nurse', 'receptionist'].includes(userRole);

    if (role === 'staff' && !isStaff) {
      await supabase.auth.signOut();
      throw new Error('Acesso não autorizado para funcionários');
    }

    if (role === 'patient' && userRole !== 'patient') {
      await supabase.auth.signOut();
      throw new Error('Acesso não autorizado para pacientes');
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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
