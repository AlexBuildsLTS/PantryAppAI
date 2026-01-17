/**
 * @file OnboardingService.ts
 * @description Fully automated, production-grade onboarding for Pantry Pal.
 * Ensures every new user is provisioned with a household, membership, and default storage locations.
 */

import { supabase } from '../lib/supabase';
import { Database } from '../types/database.types';

export class OnboardingService {
    /**
     * Runs the full onboarding flow for a new user.
     * @param userId - The Supabase Auth user ID
     * @param fullName - The user's full name
     * @returns {Promise<{ success: boolean; error?: string }>} Result
     */
    static async onboardUser(userId: string, fullName: string): Promise<{ success: boolean; error?: string }> {
        try {
            // 1. Create or update profile
            // Fetch user email from auth (required for profile)
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError || !userData?.user?.email) {
                throw new Error('Unable to fetch user email for onboarding.');
            }
            await supabase.from('profiles').upsert({
                id: userId,
                email: userData.user.email,
                full_name: fullName,
                member_rank: 'member',
                role: 'member',
            } as Database['public']['Tables']['profiles']['Insert']);

            // 2. Create household
            const { data: household, error: householdError } = await supabase
                .from('households')
                .insert({
                    name: `${fullName.split(' ')[0]}'s Household`,
                    invite_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
                    currency: 'USD',
                    created_by: userId,
                } as Database['public']['Tables']['households']['Insert'])
                .select()
                .single();
            if (householdError) throw householdError;

            // 3. Add user to household_members
            await supabase.from('household_members').insert({
                household_id: household.id,
                user_id: userId,
                member_role: 'member',
            } as Database['public']['Tables']['household_members']['Insert']);

            // 4. Create default storage locations
            const defaultLocations = [
                { name: 'Pantry', location_type: 'PANTRY' },
                { name: 'Fridge', location_type: 'FRIDGE' },
                { name: 'Freezer', location_type: 'FREEZER' },
            ];
            for (const loc of defaultLocations) {
                await supabase.from('storage_locations').insert({
                    household_id: household.id,
                    name: loc.name,
                    location_type: loc.location_type as Database['public']['Enums']['storage_type'],
                } as Database['public']['Tables']['storage_locations']['Insert']);
            }

            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
}
