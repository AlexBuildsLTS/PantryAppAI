/**
 * @file contexts/AuthContext.tsx
 * @description Enterprise Auth & Identity Sync.
 * FIXES: 
 * 1. Infinite Redirect: Forces isLoading to false even if database 500s occur.
 * 2. 403 Resilience: Safely handles missing household metadata.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Tables } from '../types/database.types';
import { OnboardingService } from '../services/OnboardingService';

type Profile = Tables<'profiles'>;
type Household = Tables<'households'>;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  household: Household | null;
  isLoading: boolean;
  refreshMetadata: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: any }>; // Added
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>; // Added
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const hydrateMetadata = useCallback(async (userId: string) => {
    try {
      // Fetch Profile (PRO status)
      const { data: pData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (pData) setProfile(pData);

      // Fetch Household Membership
      // .maybeSingle() prevents a crash if no membership exists yet
      const { data: mData, error: mError } = await supabase
        .from('household_members')
        .select('households(*)')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      if (mError) {
        // If database 500s or 403s, we log it but DON'T block the app
        console.warn("[Auth Context] Database Sync Delayed:", mError.message);
        setHousehold(null);
      } else if (mData?.households) {
        setHousehold(mData.households as unknown as Household);
      } else {
        setHousehold(null);
      }
    } catch (e) {
      console.error("[Auth Context] Critical Sync Failure:", e);
    } finally {
      // CRITICAL FIX: Always release the loading state so the user can see the UI
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // 1. Initial Session Check
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      if (existingSession?.user) {
        hydrateMetadata(existingSession.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // 2. Listen for Auth State Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        await hydrateMetadata(newSession.user.id);
      } else {
        setProfile(null);
        setHousehold(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [hydrateMetadata]);


  // --- AUTH METHODS ---
  const signIn = useCallback(async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data?.user) {
      await hydrateMetadata(data.user.id);
    }
    return { error };
  }, [hydrateMetadata]);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    if (!error && data?.user?.id) {
      // Run full onboarding automation
      await OnboardingService.onboardUser(data.user.id, fullName);
    }
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setHousehold(null);
    setIsLoading(false);
  }, []);

  const value = useMemo(() => ({
    session,
    user: session?.user ?? null,
    profile,
    household,
    isLoading,
    refreshMetadata: async () => {
      if (session?.user) await hydrateMetadata(session.user.id);
    },
    signIn,
    signUp,
    signOut
  }), [session, profile, household, isLoading, hydrateMetadata, signIn, signUp, signOut]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};