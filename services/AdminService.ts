/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * @file AdminService.ts
 * @description Enterprise Admin Orchestrator. Matches Database Schema v8.0.
 */

import { supabase } from './supabase';
import { Database } from '../types/database.types';

// Explicitly pull types from the Database interface to ensure alignment
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
type SupportTicket = Database['public']['Tables']['support_tickets']['Row'];
type UserRole = Database['public']['Tables']['profiles']['Row']['role'];

// Constants for better maintainability
const ACTIVE_TICKET_STATUSES = ['open', 'pending', 'in_progress'];
const MIN_BAN_DURATION_DAYS = 1;
const MAX_BAN_DURATION_DAYS = 365;

/**
 * Validates if a string is a valid UUID v4.
 */
function isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

/**
 * Validates if the user role is one of the allowed values.
 */
function isValidUserRole(role: string): role is Database['public']['Enums']['user_role'] {
    const validRoles: Database['public']['Enums']['user_role'][] = ['member', 'premium', 'moderator', 'admin'];
    return validRoles.includes(role as Database['public']['Enums']['user_role']);
}

export class AdminService {
    /**
     * Updates a user's role. Ensures alignment with the 'role' column in profiles table.
     * @param userId - The UUID of the user to update.
     * @param newRole - The new role to assign.
     * @returns The updated profile data.
     * @throws Error if userId is invalid, newRole is invalid, or database operation fails.
     */
    static async changeUserRole(userId: string, newRole: UserRole): Promise<Database['public']['Tables']['profiles']['Row']> {
        if (!isValidUUID(userId)) {
            throw new Error('Invalid user ID: must be a valid UUID.');
        }
        if (!isValidUserRole(newRole)) {
            throw new Error(`Invalid user role: ${newRole}. Must be one of member, premium, moderator, admin.`);
        }

        const updatePayload = {
            role: newRole,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await (supabase as any)
            .from('profiles')
            .update(updatePayload)
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to update user role: ${error.message}`);
        }
        if (!data) {
            throw new Error('User not found or update did not return data.');
        }
        return data;
    }

    /**
     * Bans a user using the enterprise moderation fields.
     * @param userId - The UUID of the user to ban.
     * @param reason - The reason for the ban.
     * @param durationDays - The number of days for the ban (0 for permanent).
     * @returns True if the ban was successful.
     * @throws Error if inputs are invalid or database operation fails.
     */
    static async banUser(userId: string, reason: string, durationDays: number): Promise<boolean> {
        if (!isValidUUID(userId)) {
            throw new Error('Invalid user ID: must be a valid UUID.');
        }
        if (!reason.trim()) {
            throw new Error('Reason for ban cannot be empty.');
        }
        if (durationDays < 0 || durationDays > MAX_BAN_DURATION_DAYS) {
            throw new Error(`Invalid ban duration: must be between 0 and ${MAX_BAN_DURATION_DAYS} days.`);
        }

        const bannedUntil = durationDays === 0 ? null : new Date();
        if (bannedUntil) {
            bannedUntil.setDate(bannedUntil.getDate() + durationDays);
        }

        const updatePayload: ProfileUpdate = {
            is_banned: true,
            banned_until: bannedUntil?.toISOString() ?? null,
            moderation_notes: reason,
            updated_at: new Date().toISOString()
        };

        const { error } = await (supabase as any)
            .from('profiles')
            .update(updatePayload)
            .eq('id', userId);

        if (error) {
            throw new Error(`Failed to ban user: ${error.message}`);
        }
        return true;
    }

    /**
     * Fetches active support tickets from the support_tickets table.
     * Active tickets are those with status in ['open', 'pending', 'in_progress'].
     * @returns An array of active support tickets, ordered by creation date descending.
     * @throws Error if database operation fails.
     */
    static async getActiveTickets(): Promise<SupportTicket[]> {
        const { data, error } = await supabase
            .from('support_tickets')
            .select('*')
            .in('status', ACTIVE_TICKET_STATUSES)
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(`Failed to fetch active tickets: ${error.message}`);
        }
        return data || [];
    }
}