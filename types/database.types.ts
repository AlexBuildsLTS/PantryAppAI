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
          code: string | null
          description: string | null
          id: string
          points: number | null
          title: string
        }
        Insert: {
          badge_url?: string | null
          code?: string | null
          description?: string | null
          id?: string
          points?: number | null
          title: string
        }
        Update: {
          badge_url?: string | null
          code?: string | null
          description?: string | null
          id?: string
          points?: number | null
          title?: string
        }
        Relationships: []
      }
      household_members: {
        Row: {
          household_id: string | null
          id: string
          joined_at: string | null
          member_role: Database["public"]["Enums"]["user_role"] | null
          user_id: string | null
        }
        Insert: {
          household_id?: string | null
          id?: string
          joined_at?: string | null
          member_role?: Database["public"]["Enums"]["user_role"] | null
          user_id?: string | null
        }
        Update: {
          household_id?: string | null
          id?: string
          joined_at?: string | null
          member_role?: Database["public"]["Enums"]["user_role"] | null
          user_id?: string | null
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
          currency: string | null
          id: string
          invite_code: string | null
          name: string
          waste_reduction_target: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          id?: string
          invite_code?: string | null
          name: string
          waste_reduction_target?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          id?: string
          invite_code?: string | null
          name?: string
          waste_reduction_target?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "households_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_logs: {
        Row: {
          action: Database["public"]["Enums"]["action_type"]
          co2_impact: number | null
          financial_impact: number | null
          household_id: string | null
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
          household_id?: string | null
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
          household_id?: string | null
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
      pantry_items: {
        Row: {
          added_by: string | null
          ai_confidence_score: number | null
          barcode: string | null
          brand: string | null
          category: string | null
          cost_per_unit: number | null
          created_at: string | null
          expiry_date: string | null
          household_id: string | null
          id: string
          image_url: string | null
          initial_quantity: number | null
          is_opened: boolean | null
          name: string
          nutritional_info: Json | null
          opened_at: string | null
          purchase_date: string | null
          quantity: number
          status: Database["public"]["Enums"]["item_status"] | null
          storage_id: string | null
          unit: string | null
          updated_at: string | null
          vision_metadata: Json | null
          weight_grams: number | null
        }
        Insert: {
          added_by?: string | null
          ai_confidence_score?: number | null
          barcode?: string | null
          brand?: string | null
          category?: string | null
          cost_per_unit?: number | null
          created_at?: string | null
          expiry_date?: string | null
          household_id?: string | null
          id?: string
          image_url?: string | null
          initial_quantity?: number | null
          is_opened?: boolean | null
          name: string
          nutritional_info?: Json | null
          opened_at?: string | null
          purchase_date?: string | null
          quantity?: number
          status?: Database["public"]["Enums"]["item_status"] | null
          storage_id?: string | null
          unit?: string | null
          updated_at?: string | null
          vision_metadata?: Json | null
          weight_grams?: number | null
        }
        Update: {
          added_by?: string | null
          ai_confidence_score?: number | null
          barcode?: string | null
          brand?: string | null
          category?: string | null
          cost_per_unit?: number | null
          created_at?: string | null
          expiry_date?: string | null
          household_id?: string | null
          id?: string
          image_url?: string | null
          initial_quantity?: number | null
          is_opened?: boolean | null
          name?: string
          nutritional_info?: Json | null
          opened_at?: string | null
          purchase_date?: string | null
          quantity?: number
          status?: Database["public"]["Enums"]["item_status"] | null
          storage_id?: string | null
          unit?: string | null
          updated_at?: string | null
          vision_metadata?: Json | null
          weight_grams?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pantry_items_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          is_onboarded: boolean | null
          preferred_language: string | null
          push_notifications_enabled: boolean | null
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
          created_at?: string | null
          full_name?: string | null
          id: string
          is_onboarded?: boolean | null
          preferred_language?: string | null
          push_notifications_enabled?: boolean | null
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
          created_at?: string | null
          full_name?: string | null
          id?: string
          is_onboarded?: boolean | null
          preferred_language?: string | null
          push_notifications_enabled?: boolean | null
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
      shopping_list: {
        Row: {
          created_at: string | null
          household_id: string | null
          id: string
          is_completed: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          household_id?: string | null
          id?: string
          is_completed?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          household_id?: string | null
          id?: string
          is_completed?: boolean | null
          name?: string
        }
        Relationships: []
      }
      shopping_list_items: {
        Row: {
          category: string
          added_by: string | null
          created_at: string | null
          id: string
          is_bought: boolean | null
          list_id: string | null
          name: string
          quantity: number | null
          suggested_item_id: string | null
        }
        Insert: {
          added_by?: string | null
          created_at?: string | null
          id?: string
          is_bought?: boolean | null
          list_id?: string | null
          name: string
          quantity?: number | null
          suggested_item_id?: string | null
        }
        Update: {
          added_by?: string | null
          created_at?: string | null
          id?: string
          is_bought?: boolean | null
          list_id?: string | null
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
          household_id: string | null
          id: string
          is_completed: boolean | null
          name: string | null
        }
        Insert: {
          created_at?: string | null
          household_id?: string | null
          id?: string
          is_completed?: boolean | null
          name?: string | null
        }
        Update: {
          created_at?: string | null
          household_id?: string | null
          id?: string
          is_completed?: boolean | null
          name?: string | null
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
          household_id: string | null
          id: string
          is_default: boolean | null
          location_type: string | null
          name: string
        }
        Insert: {
          created_at?: string | null
          household_id?: string | null
          id?: string
          is_default?: boolean | null
          location_type?: string | null
          name: string
        }
        Update: {
          created_at?: string | null
          household_id?: string | null
          id?: string
          is_default?: boolean | null
          location_type?: string | null
          name?: string
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
      [_ in never]: never
    }
    Enums: {
      action_type:
        | "added"
        | "consumed"
        | "wasted"
        | "edited"
        | "restocked"
        | "expired"
      app_role: "admin" | "moderator" | "member"
      item_status: "fresh" | "expiring_soon" | "expired" | "consumed" | "wasted"
      storage_type: "pantry" | "fridge" | "freezer" | "other"
      sub_tier: "free" | "premium" | "pro"
      subscription_tier: "free" | "premium" | "pro"
      user_role: "admin" | "moderator" | "member"
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
        "added",
        "consumed",
        "wasted",
        "edited",
        "restocked",
        "expired",
      ],
      app_role: ["admin", "moderator", "member"],
      item_status: ["fresh", "expiring_soon", "expired", "consumed", "wasted"],
      storage_type: ["pantry", "fridge", "freezer", "other"],
      sub_tier: ["free", "premium", "pro"],
      subscription_tier: ["free", "premium", "pro"],
      user_role: ["admin", "moderator", "member"],
    },
  },
} as const
