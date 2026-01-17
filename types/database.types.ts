export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          badge_url: string | null
          category: string | null
          code: string
          created_at: string | null
          description: string | null
          id: string
          points: number | null
          title: string
        }
        Insert: {
          badge_url?: string | null
          category?: string | null
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          points?: number | null
          title: string
        }
        Update: {
          badge_url?: string | null
          category?: string | null
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          points?: number | null
          title?: string
        }
        Relationships: []
      }
      admin_activity_logs: {
        Row: {
          action_type: string
          admin_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          target_resource: string | null
          target_user_id: string | null
        }
        Insert: {
          action_type: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_resource?: string | null
          target_user_id?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_resource?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_activity_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_activity_logs_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      food_categories: {
        Row: {
          average_shelf_life_days: number | null
          color_hex: string | null
          created_at: string | null
          icon_emoji: string | null
          id: string
          name: string
          storage_recommendations: string[] | null
        }
        Insert: {
          average_shelf_life_days?: number | null
          color_hex?: string | null
          created_at?: string | null
          icon_emoji?: string | null
          id?: string
          name: string
          storage_recommendations?: string[] | null
        }
        Update: {
          average_shelf_life_days?: number | null
          color_hex?: string | null
          created_at?: string | null
          icon_emoji?: string | null
          id?: string
          name?: string
          storage_recommendations?: string[] | null
        }
        Relationships: []
      }
      household_members: {
        Row: {
          household_id: string
          id: string
          joined_at: string | null
          member_role: Database["public"]["Enums"]["user_role"] | null
          user_id: string
        }
        Insert: {
          household_id: string
          id?: string
          joined_at?: string | null
          member_role?: Database["public"]["Enums"]["user_role"] | null
          user_id: string
        }
        Update: {
          household_id?: string
          id?: string
          joined_at?: string | null
          member_role?: Database["public"]["Enums"]["user_role"] | null
          user_id?: string
        }
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
          },
        ]
      }
      households: {
        Row: {
          created_at: string | null
          created_by: string | null
          currency: string
          id: string
          invite_code: string
          name: string
          waste_reduction_target: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          currency?: string
          id?: string
          invite_code: string
          name: string
          waste_reduction_target?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          currency?: string
          id?: string
          invite_code?: string
          name?: string
          waste_reduction_target?: number | null
        }
        Relationships: []
      }
      inventory_logs: {
        Row: {
          action: Database["public"]["Enums"]["action_type"]
          co2_impact: number | null
          financial_impact: number | null
          household_id: string
          id: string
          item_id: string | null
          logged_at: string | null
          notes: string | null
          quantity_delta: number | null
          user_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["action_type"]
          co2_impact?: number | null
          financial_impact?: number | null
          household_id: string
          id?: string
          item_id?: string | null
          logged_at?: string | null
          notes?: string | null
          quantity_delta?: number | null
          user_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["action_type"]
          co2_impact?: number | null
          financial_impact?: number | null
          household_id?: string
          id?: string
          item_id?: string | null
          logged_at?: string | null
          notes?: string | null
          quantity_delta?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_logs_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_logs_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "pantry_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          read_at: string | null
          related_item_id: string | null
          related_recipe_id: string | null
          scheduled_for: string | null
          sent_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          read_at?: string | null
          related_item_id?: string | null
          related_recipe_id?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          read_at?: string | null
          related_item_id?: string | null
          related_recipe_id?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_item_id_fkey"
            columns: ["related_item_id"]
            isOneToOne: false
            referencedRelation: "pantry_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_recipe_id_fkey"
            columns: ["related_recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pantry_items: {
        Row: {
          ai_confidence_score: number | null
          barcode: string | null
          brand: string | null
          category: string | null
          cost_per_unit: number | null
          created_at: string | null
          expiry_date: string
          household_id: string
          id: string
          image_url: string | null
          initial_quantity: number | null
          is_opened: boolean | null
          name: string
          nutritional_info: Json | null
          opened_at: string | null
          purchase_date: string | null
          quantity: number
          status: Database["public"]["Enums"]["item_status"]
          storage_id: string | null
          unit: string | null
          updated_at: string | null
          user_id: string
          vision_metadata: Json | null
          weight_grams: number | null
        }
        Insert: {
          ai_confidence_score?: number | null
          barcode?: string | null
          brand?: string | null
          category?: string | null
          cost_per_unit?: number | null
          created_at?: string | null
          expiry_date: string
          household_id?: string
          id?: string
          image_url?: string | null
          initial_quantity?: number | null
          is_opened?: boolean | null
          name: string
          nutritional_info?: Json | null
          opened_at?: string | null
          purchase_date?: string | null
          quantity?: number
          status?: Database["public"]["Enums"]["item_status"]
          storage_id?: string | null
          unit?: string | null
          updated_at?: string | null
          user_id: string
          vision_metadata?: Json | null
          weight_grams?: number | null
        }
        Update: {
          ai_confidence_score?: number | null
          barcode?: string | null
          brand?: string | null
          category?: string | null
          cost_per_unit?: number | null
          created_at?: string | null
          expiry_date?: string
          household_id?: string
          id?: string
          image_url?: string | null
          initial_quantity?: number | null
          is_opened?: boolean | null
          name?: string
          nutritional_info?: Json | null
          opened_at?: string | null
          purchase_date?: string | null
          quantity?: number
          status?: Database["public"]["Enums"]["item_status"]
          storage_id?: string | null
          unit?: string | null
          updated_at?: string | null
          user_id?: string
          vision_metadata?: Json | null
          weight_grams?: number | null
        }
        Relationships: [
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
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banned_until: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_banned: boolean | null
          is_onboarded: boolean | null
          member_rank: Database["public"]["Enums"]["user_role"]
          moderation_notes: string | null
          preferred_language: string | null
          push_notifications_enabled: boolean | null
          push_token: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          sustainability_score: number | null
          tier: Database["public"]["Enums"]["sub_tier"] | null
          total_co2_saved_kg: number | null
          total_savings_usd: number | null
          updated_at: string | null
          username: string | null
          waste_percentage: number | null
        }
        Insert: {
          avatar_url?: string | null
          banned_until?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          is_banned?: boolean | null
          is_onboarded?: boolean | null
          member_rank?: Database["public"]["Enums"]["user_role"]
          moderation_notes?: string | null
          preferred_language?: string | null
          push_notifications_enabled?: boolean | null
          push_token?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          sustainability_score?: number | null
          tier?: Database["public"]["Enums"]["sub_tier"] | null
          total_co2_saved_kg?: number | null
          total_savings_usd?: number | null
          updated_at?: string | null
          username?: string | null
          waste_percentage?: number | null
        }
        Update: {
          avatar_url?: string | null
          banned_until?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_banned?: boolean | null
          is_onboarded?: boolean | null
          member_rank?: Database["public"]["Enums"]["user_role"]
          moderation_notes?: string | null
          preferred_language?: string | null
          push_notifications_enabled?: boolean | null
          push_token?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          sustainability_score?: number | null
          tier?: Database["public"]["Enums"]["sub_tier"] | null
          total_co2_saved_kg?: number | null
          total_savings_usd?: number | null
          updated_at?: string | null
          username?: string | null
          waste_percentage?: number | null
        }
        Relationships: []
      }
      recipes: {
        Row: {
          ai_confidence_score: number | null
          cook_time_minutes: number | null
          created_at: string | null
          description: string | null
          dietary_restrictions: string[] | null
          difficulty: string | null
          household_id: string | null
          id: string
          image_url: string | null
          ingredients: Json
          instructions: Json
          is_ai_generated: boolean | null
          nutritional_info: Json | null
          prep_time_minutes: number | null
          servings: number | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_confidence_score?: number | null
          cook_time_minutes?: number | null
          created_at?: string | null
          description?: string | null
          dietary_restrictions?: string[] | null
          difficulty?: string | null
          household_id?: string | null
          id?: string
          image_url?: string | null
          ingredients: Json
          instructions: Json
          is_ai_generated?: boolean | null
          nutritional_info?: Json | null
          prep_time_minutes?: number | null
          servings?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_confidence_score?: number | null
          cook_time_minutes?: number | null
          created_at?: string | null
          description?: string | null
          dietary_restrictions?: string[] | null
          difficulty?: string | null
          household_id?: string | null
          id?: string
          image_url?: string | null
          ingredients?: Json
          instructions?: Json
          is_ai_generated?: boolean | null
          nutritional_info?: Json | null
          prep_time_minutes?: number | null
          servings?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipes_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_list_items: {
        Row: {
          added_by: string | null
          category: string | null
          created_at: string | null
          id: string
          is_bought: boolean | null
          list_id: string
          name: string
          quantity: number | null
          suggested_item_id: string | null
        }
        Insert: {
          added_by?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          is_bought?: boolean | null
          list_id: string
          name: string
          quantity?: number | null
          suggested_item_id?: string | null
        }
        Update: {
          added_by?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          is_bought?: boolean | null
          list_id?: string
          name?: string
          quantity?: number | null
          suggested_item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopping_list_items_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "shopping_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_list_items_suggested_item_id_fkey"
            columns: ["suggested_item_id"]
            isOneToOne: false
            referencedRelation: "pantry_items"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_lists: {
        Row: {
          created_at: string | null
          household_id: string
          id: string
          is_completed: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          household_id: string
          id?: string
          is_completed?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          household_id?: string
          id?: string
          is_completed?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopping_lists_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      storage_locations: {
        Row: {
          created_at: string | null
          custom_icon: string | null
          household_id: string
          humidity: number | null
          id: string
          location_type: Database["public"]["Enums"]["storage_type"]
          name: string
          temperature: number | null
        }
        Insert: {
          created_at?: string | null
          custom_icon?: string | null
          household_id: string
          humidity?: number | null
          id?: string
          location_type?: Database["public"]["Enums"]["storage_type"]
          name: string
          temperature?: number | null
        }
        Update: {
          created_at?: string | null
          custom_icon?: string | null
          household_id?: string
          humidity?: number | null
          id?: string
          location_type?: Database["public"]["Enums"]["storage_type"]
          name?: string
          temperature?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "storage_locations_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          admin_id: string | null
          admin_response: string | null
          category: string | null
          created_at: string | null
          id: string
          message: string
          priority: string | null
          resolution_notes: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_id?: string | null
          admin_response?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          message: string
          priority?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_id?: string | null
          admin_response?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          message?: string
          priority?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_membership: {
        Args: { target_household_id: string }
        Returns: boolean
      }
      is_household_member: { Args: { hid: string }; Returns: boolean }
      is_member_of: { Args: { target_household_id: string }; Returns: boolean }
      is_vault_member: {
        Args: { target_household_id: string }
        Returns: boolean
      }
      log_admin_action: {
        Args: {
          p_action_type: string
          p_details?: Json
          p_target_resource?: string
          p_target_user_id?: string
        }
        Returns: undefined
      }
      update_sustainability_metrics: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      validate_and_accept_invite: {
        Args: { p_invite_code: string; p_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      action_type:
      | "ADDED"
      | "CONSUMED"
      | "WASTED"
      | "RESTOCKED"
      | "EXPIRED"
      | "MOVED"
      | "added"
      | "consumed"
      | "wasted"
      | "restocked"
      | "expired"
      | "moved"
      item_status: "fresh" | "expiring_soon" | "expired" | "consumed" | "wasted"
      notification_type:
      | "expiry_alert"
      | "shopping_suggestion"
      | "achievement"
      | "system"
      | "household_invite"
      storage_type: "PANTRY" | "FRIDGE" | "FREEZER" | "CELLAR" | "OTHER"
      sub_tier: "free" | "premium" | "pro"
      sub_tier_tmp_for_migration: "free" | "premium" | "pro"
      ticket_status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"
      user_role: "admin" | "moderator" | "premium" | "member"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {
      action_type: [
        "ADDED",
        "CONSUMED",
        "WASTED",
        "RESTOCKED",
        "EXPIRED",
        "MOVED",
        "added",
        "consumed",
        "wasted",
        "restocked",
        "expired",
        "moved",
      ],
      item_status: ["fresh", "expiring_soon", "expired", "consumed", "wasted"],
      notification_type: [
        "expiry_alert",
        "shopping_suggestion",
        "achievement",
        "system",
        "household_invite",
      ],
      storage_type: ["PANTRY", "FRIDGE", "FREEZER", "CELLAR", "OTHER"],
      sub_tier: ["free", "premium", "pro"],
      sub_tier_tmp_for_migration: ["free", "premium", "pro"],
      ticket_status: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"],
      user_role: ["admin", "moderator", "premium", "member"],
    },
  },
} as const
