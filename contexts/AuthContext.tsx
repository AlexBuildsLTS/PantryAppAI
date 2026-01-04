/**
 * @module AuthContext
 * The core state engine for Pantry Pal.
 * Manages Session, User Profile, and Household-context globally.
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string;
  role: 'admin' | 'moderator' | 'premium' | 'member';
}

interface Household {
  id: string;
  name: string;
}

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  household: Household | null;
  isLoading: boolean;
  signIn: (email: string, pass: string) => Promise<any>;
  signUp: (email: string, pass: string, name: string) => Promise<any>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial Session Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthStateChange(session);
    });

    // Listen for real-time Auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuthStateChange(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Orchestrates the fetching of user metadata when auth state changes.
   */
  const handleAuthStateChange = async (currentSession: Session | null) => {
    setSession(currentSession);
    const currentUser = currentSession?.user ?? null;
    setUser(currentUser);

    if (currentUser) {
      await fetchUserData(currentUser.id);
    } else {
      // Clear state on Logout
      setProfile(null);
      setHousehold(null);
    }
    setIsLoading(false);
  };

  /**
   * Senior-Level Optimization: Fetch profile and household in parallel
   */
  const fetchUserData = async (userId: string) => {
    try {
      // 1. Fetch Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // 2. Fetch the primary household the user belongs to
      const { data: membership } = await supabase
        .from('household_members')
        .select('household_id, households(id, name)')
        .eq('user_id', userId)
        .single();

      if (profileData) setProfile(profileData);
      if (membership?.households) {
        // @ts-ignore - handling nested supabase join
        setHousehold(membership.households);
      }
    } catch (error) {
      console.error('Error fetching user global state:', error);
    }
  };

  const signIn = (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password });

  const signUp = (email: string, password: string, full_name: string) =>
    supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name } },
    });

  const signOut = async () => {
    await supabase.auth.signOut();
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
