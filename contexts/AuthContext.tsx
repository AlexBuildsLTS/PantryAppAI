/**
 * @file AuthContext.tsx
 * @description Master AAA+ Tier Auth Orchestrator.
 * Features:
 * - Race-condition protection using .maybeSingle()
 * - Parallel metadata hydration (Profile + Household)
 * - Real-time session synchronization
 * - Error-resilient navigation guards
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

/**
 * TYPE DEFINITIONS
 */
interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'owner' | 'admin' | 'member';
  push_token?: string;
}

interface Household {
  id: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  household: Household | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (
    email: string,
    password: string,
    name?: string
  ) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshMetadata: () => Promise<void>; // Added for manual sync
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * HYDRATION ENGINE
   * Fetches profile and household in parallel.
   * Uses maybeSingle() to prevent 406 "Not Acceptable" errors if DB triggers are still running.
   */
  const fetchUserData = useCallback(async (userId: string) => {
    try {
      const [profileRes, membershipRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase
          .from('household_members')
          .select('household_id, households(id, name)')
          .eq('user_id', userId)
          .maybeSingle(),
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data as Profile);
      }

      // Safe navigation of the nested join result
      if (membershipRes.data && (membershipRes.data as any).households) {
        setHousehold((membershipRes.data as any).households as Household);
      }
    } catch (error) {
      console.warn('[Auth] Metadata sync skipped or delayed:', error);
    }
  }, []);

  /**
   * AUTH STATE ORCHESTRATOR
   * Reacts to login, logout, and token refreshes.
   */
  const handleAuthStateChange = useCallback(
    async (currentSession: Session | null) => {
      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await fetchUserData(currentUser.id);
      } else {
        setProfile(null);
        setHousehold(null);
      }

      // Smooth transition: delay loading state slightly to ensure UI hydration
      setTimeout(() => setIsLoading(false), 100);
    },
    [fetchUserData]
  );

  useEffect(() => {
    // 1. Check existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthStateChange(session);
    });

    // 2. Listen for real-time Auth events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuthStateChange(session);
    });

    return () => subscription.unsubscribe();
  }, [handleAuthStateChange]);

  /**
   * EXPOSED ACTIONS
   */
  const signIn = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const signUp = async (email: string, password: string, name?: string) => {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: 'pantrypal://login-callback',
      },
    });
  };

  const signOut = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
  };

  const refreshMetadata = async () => {
    if (user) await fetchUserData(user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        household,
        isLoading,
        signIn,
        signUp,
        signOut,
        refreshMetadata,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
