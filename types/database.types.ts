/**
 * @file database.types.ts
 * @module PantryPal.Enterprise.Domain
 * @description 
 * THE MASTER ENTERPRISE SCHEMA DEFINITION (v11.0 Gold Standard).
 * * This module provides the absolute type definitions for the Pantry Pal ecosystem.
 * It is engineered for extreme type-safety, ensuring that any deviation in the 
 * database schema is caught at compile-time within the React Native application.
 * * DESIGN PATTERNS:
 * 1. SOURCE OF TRUTH: Direct parity with Supabase PostgreSQL schema.
 * 2. TRANSACTIONAL INTEGRITY: Explicit 'Insert' and 'Update' interfaces to prevent data corruption.
 * 3. AI ENHANCEMENT: Dedicated high-precision slots for Google Gemini Vision metadata.
 * 4. COLLABORATIVE SYNC: Support for multi-user Household and pivot role logic.
 * 5. DEVELOPER EXPERIENCE (DX): Exhaustive JSDoc documentation for IDE intellisense.
 */

/**
 * Valid JSON types supported by PostgreSQL/Supabase.
 * Essential for vision_metadata and nutritional_info storage.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/**
 * THE CORE DATABASE INTERFACE
 * Represents the entire 'public' schema of the Pantry Pal PostgreSQL instance.
 */
export interface Database {
  /** Internal metadata for Supabase Client versioning */
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  };

  public: {
    Tables: {
      /**
       * -----------------------------------------------------------------------
       * TABLE: profiles
       * -----------------------------------------------------------------------
       * Extends auth.users to store application-specific user metadata.
       * Includes moderation, subscription tiering, and gamification metrics.
       */
      profiles: {
        Row: {
          /** Primary Key: Directly linked to auth.users.id */
          id: string;
          /** User's verified email address synced from auth */
          email: string;
          /** Display name provided during onboarding */
          full_name: string | null;
          /** Unique social identifier */
          username: string | null;
          /** Hosted URL for profile image assets */
          avatar_url: string | null;
          /** RBAC: System permission level */
          role: Database['public']['Enums']['user_role'];
          /** Monetization: Active subscription tier */
          tier: Database['public']['Enums']['sub_tier'];
          /** Flag indicating if the user completed initial setup */
          is_onboarded: boolean;
          /** ISO code for localized UI (e.g., 'en', 'es') */
          preferred_language: string;
          /** Toggle for cloud-based push messaging */
          push_notifications_enabled: boolean;
          /** Device-specific token for FCM/APNS routing */
          push_token: string | null;
          /** User's aggregate waste-prevention score */
          sustainability_score: number;
          /** Estimated cumulative savings in USD */
          total_savings_usd: number;
          /** Cumulative carbon footprint reduction in kg */
          total_co2_saved_kg: number;
          /** Real-time calculation of food utilization efficiency */
          waste_percentage: number;
          /** MODERATION: Active account restriction status */
          is_banned: boolean;
          /** ISO timestamp for expiration of account ban */
          banned_until: string | null;
          /** Private administrator logs regarding user conduct */
          moderation_notes: string | null;
          /** ISO creation timestamp */
          created_at: string;
          /** ISO last modification timestamp */
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          username?: string | null;
          avatar_url?: string | null;
          role?: Database['public']['Enums']['user_role'];
          tier?: Database['public']['Enums']['sub_tier'];
          is_onboarded?: boolean;
          preferred_language?: string;
          push_notifications_enabled?: boolean;
          push_token?: string | null;
          sustainability_score?: number;
          total_savings_usd?: number;
          total_co2_saved_kg?: number;
          waste_percentage?: number;
          is_banned?: boolean;
          banned_until?: string | null;
          moderation_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          username?: string | null;
          avatar_url?: string | null;
          role?: Database['public']['Enums']['user_role'];
          tier?: Database['public']['Enums']['sub_tier'];
          is_onboarded?: boolean;
          preferred_language?: string;
          push_notifications_enabled?: boolean;
          push_token?: string | null;
          sustainability_score?: number;
          total_savings_usd?: number;
          total_co2_saved_kg?: number;
          waste_percentage?: number;
          is_banned?: boolean;
          banned_until?: string | null;
          moderation_notes?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ];
      };

      /**
       * -----------------------------------------------------------------------
       * TABLE: pantry_items
       * -----------------------------------------------------------------------
       * THE CORE INVENTORY LEDGER. Enriched by Google Gemini Multi-Modal vision data.
       */
      pantry_items: {
        Row: {
          /** Unique identifier for the food item */
          id: string;
          /** Foreign Key: Primary household container */
          household_id: string;
          /** Foreign Key: Specific shelf/unit (Fridge vs Freezer) */
          storage_id: string | null;
          /** Foreign Key: User who registered the item */
          user_id: string;
          /** Common name of the food (AI Generated) */
          name: string;
          /** Manufacturer or brand name (AI Detected) */
          brand: string | null;
          /** AI-assigned classification (Produce, Dairy, etc.) */
          category: string;
          /** UPC/EAN code from packaging */
          barcode: string | null;
          /** Current count or mass in the pantry */
          quantity: number;
          /** Mass/Count at time of purchase for usage metrics */
          initial_quantity: number;
          /** SI unit of measurement (pcs, kg, L) */
          unit: string;
          /** Absolute weight in grams for precise analytics */
          weight_grams: number;
          /** Monetary value per individual unit */
          cost_per_unit: number;
          /** ISO date when the item is projected to spoil */
          expiry_date: string | null;
          /** ISO date when the item was purchased */
          purchase_date: string;
          /** ISO timestamp of first usage event */
          opened_at: string | null;
          /** Flag indicating if the seal has been broken */
          is_opened: boolean;
          /** Lifecycle status (fresh, expiring, etc.) */
          status: Database['public']['Enums']['item_status'];
          /** * AI confidence score from vision processing (0.000 to 1.000). */
          ai_confidence_score: number | null;
          /** * JSON Blob containing calories, protein, carbs, and fats per serving. */
          nutritional_info: Json;
          /** * JSON Blob containing raw vision API results (bounding boxes, labels). */
          vision_metadata: Json;
          /** Public URL of the scanned item image */
          image_url: string | null;
          /** Record creation timestamp */
          created_at: string;
          /** Record modification timestamp */
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          storage_id?: string | null;
          user_id: string;
          name: string;
          brand?: string | null;
          category?: string;
          barcode?: string | null;
          quantity?: number;
          initial_quantity?: number;
          unit?: string;
          weight_grams?: number;
          cost_per_unit?: number;
          expiry_date?: string | null;
          purchase_date?: string;
          opened_at?: string | null;
          is_opened?: boolean;
          status?: Database['public']['Enums']['item_status'];
          ai_confidence_score?: number | null;
          nutritional_info?: Json;
          vision_metadata?: Json;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          household_id?: string;
          storage_id?: string | null;
          user_id?: string;
          name?: string;
          brand?: string | null;
          category?: string;
          barcode?: string | null;
          quantity?: number;
          initial_quantity?: number;
          unit?: string;
          weight_grams?: number;
          cost_per_unit?: number;
          expiry_date?: string | null;
          purchase_date?: string;
          opened_at?: string | null;
          is_opened?: boolean;
          status?: Database['public']['Enums']['item_status'];
          ai_confidence_score?: number | null;
          nutritional_info?: Json;
          vision_metadata?: Json;
          image_url?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pantry_items_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pantry_items_storage_id_fkey"
            columns: ["storage_id"]
            isOneToOne: false
            referencedRelation: "storage_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pantry_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ];
      };

      /**
       * -----------------------------------------------------------------------
       * TABLE: shopping_lists
       * -----------------------------------------------------------------------
       * Grouping entity for collaborative grocery planning.
       */
      shopping_lists: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          is_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          is_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          household_id?: string;
          name?: string;
          is_completed?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shopping_lists_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          }
        ];
      };

      /**
       * -----------------------------------------------------------------------
       * TABLE: shopping_list_items
       * -----------------------------------------------------------------------
       * Individual entries within a shopping list.
       */
      shopping_list_items: {
        Row: {
          id: string;
          list_id: string;
          name: string;
          category: string;
          quantity: number;
          is_bought: boolean;
          added_by: string | null;
          suggested_item_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          list_id: string;
          name: string;
          category?: string;
          quantity?: number;
          is_bought?: boolean;
          added_by?: string | null;
          suggested_item_id?: string | null;
          created_at?: string;
        };
        Update: {
          list_id?: string;
          name?: string;
          category?: string;
          quantity?: number;
          is_bought?: boolean;
          added_by?: string | null;
          suggested_item_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "shopping_list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "shopping_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_list_items_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_list_items_suggested_item_id_fkey"
            columns: ["suggested_item_id"]
            isOneToOne: false
            referencedRelation: "pantry_items"
            referencedColumns: ["id"]
          }
        ];
      };

      /**
       * -----------------------------------------------------------------------
       * TABLE: storage_locations
       * -----------------------------------------------------------------------
       * Physical mapping for household units.
       */
      storage_locations: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          location_type: Database['public']['Enums']['storage_type'];
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          location_type?: Database['public']['Enums']['storage_type'];
          is_default?: boolean;
          created_at?: string;
        };
        Update: {
          household_id?: string;
          name?: string;
          location_type?: Database['public']['Enums']['storage_type'];
          is_default?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "storage_locations_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          }
        ];
      };

      /**
       * -----------------------------------------------------------------------
       * TABLE: households
       * -----------------------------------------------------------------------
       * Collaborative group entity.
       */
      households: {
        Row: {
          id: string;
          name: string;
          invite_code: string;
          currency: string;
          waste_reduction_target: number;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          invite_code?: string;
          currency?: string;
          waste_reduction_target?: number;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          currency?: string;
          waste_reduction_target?: number;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "households_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ];
      };

      /**
       * -----------------------------------------------------------------------
       * TABLE: household_members
       * -----------------------------------------------------------------------
       * Pivot mapping for shared pantry access.
       */
      household_members: {
        Row: {
          id: string;
          household_id: string;
          user_id: string;
          member_role: Database['public']['Enums']['user_role'];
          joined_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          user_id: string;
          member_role?: Database['public']['Enums']['user_role'];
          joined_at?: string;
        };
        Update: {
          household_id?: string;
          user_id?: string;
          member_role?: Database['public']['Enums']['user_role'];
        };
        Relationships: [
          {
            foreignKeyName: "household_members_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "household_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ];
      };

      /**
       * -----------------------------------------------------------------------
       * TABLE: support_tickets
       * -----------------------------------------------------------------------
       * Helpdesk interface.
       */
      support_tickets: {
        Row: {
          id: string;
          user_id: string;
          subject: string;
          message: string;
          status: string;
          admin_response: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject: string;
          message: string;
          status?: string;
          admin_response?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          subject?: string;
          message?: string;
          status?: string;
          admin_response?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ];
      };

      /**
       * -----------------------------------------------------------------------
       * TABLE: inventory_logs
       * -----------------------------------------------------------------------
       * Append-only ledger for analytics.
       */
      inventory_logs: {
        Row: {
          id: string;
          household_id: string;
          user_id: string | null;
          item_id: string | null;
          action: Database['public']['Enums']['action_type'];
          quantity_delta: number;
          financial_impact: number;
          co2_impact: number;
          notes: string | null;
          logged_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          user_id?: string | null;
          item_id?: string | null;
          action: Database['public']['Enums']['action_type'];
          quantity_delta: number;
          financial_impact?: number;
          co2_impact?: number;
          notes?: string | null;
          logged_at?: string;
        };
        Update: {
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_logs_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_logs_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "pantry_items"
            referencedColumns: ["id"]
          }
        ];
      };

      /**
       * -----------------------------------------------------------------------
       * TABLE: achievements
       * -----------------------------------------------------------------------
       * Gamification milestones.
       */
      achievements: {
        Row: {
          id: string;
          code: string;
          title: string;
          description: string | null;
          points: number;
          badge_url: string | null;
        };
        Insert: {
          id?: string;
          code: string;
          title: string;
          description?: string | null;
          points?: number;
          badge_url?: string | null;
        };
        Update: {
          code?: string;
          title?: string;
          description?: string | null;
          points?: number;
          badge_url?: string | null;
        };
        Relationships: [];
      };

      /**
       * -----------------------------------------------------------------------
       * TABLE: user_achievements
       * -----------------------------------------------------------------------
       * Earned achievements per user.
       */
      user_achievements: {
        Row: {
          user_id: string;
          achievement_id: string;
          unlocked_at: string;
        };
        Insert: {
          user_id: string;
          achievement_id: string;
          unlocked_at?: string;
        };
        Update: {
          user_id?: string;
          achievement_id?: string;
          unlocked_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          }
        ];
      };
    };

    /**
     * -------------------------------------------------------------------------
     * ENUMERATED TYPES (1:1 SQL Mapping)
     * -------------------------------------------------------------------------
     */
    Enums: {
      /** RBAC Permission Roles */
      user_role: 'admin' | 'moderator' | 'premium' | 'member';
      /** Food degradation lifecycle stages */
      item_status: 'fresh' | 'expiring_soon' | 'expired' | 'consumed' | 'wasted';
      /** Monetization tiers */
      sub_tier: 'free' | 'premium' | 'pro';
      /** Storage classifications */
      storage_type: 'pantry' | 'fridge' | 'freezer' | 'other';
      /** Auditable movement types */
      action_type: 'added' | 'consumed' | 'wasted' | 'restocked' | 'expired';
    };

    /** * No views currently defined in v11.0 public schema. 
     */
    Views: {
      [_ in never]: never;
    };

    /** * No RPC functions currently defined in v11.0 public schema. 
     */
    Functions: {
      [_ in never]: never;
    };

    /** * No composite types currently defined in v11.0 public schema. 
     */
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

/**
 * -----------------------------------------------------------------------------
 * AAA+ TIER UTILITY TYPES
 * These generic helpers map the master Database interface into digestible shapes
 * for local state management and React Query hooks.
 * -----------------------------------------------------------------------------
 */

/** * Helper for extracting the Row type of a specific table. 
 */
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

/** * Helper for extracting the Insertion payload of a specific table. 
 */
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

/** * Helper for extracting the Update payload of a specific table. 
 */
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

/** * Helper for extracting the string literals of a public Enum. 
 */
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];

/** * Runtime constants for Enums, useful for form validation and UI badges. 
 */
export const EnumValues = {
  user_role: ['admin', 'moderator', 'premium', 'member'] as const,
  item_status: ['fresh', 'expiring_soon', 'expired', 'consumed', 'wasted'] as const,
  sub_tier: ['free', 'premium', 'pro'] as const,
  storage_type: ['pantry', 'fridge', 'freezer', 'other'] as const,
  action_type: ['added', 'consumed', 'wasted', 'restocked', 'expired'] as const,
};

// =============================================================================
// END OF DEFINITIVE TYPE SYSTEM
// =============================================================================