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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      cycles: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          notes: string | null
          start_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          start_date: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          start_date?: string
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          description: string
          id: string
          type: string
          user_id: string
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          date: string
          description: string
          id?: string
          type?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      fasts: {
        Row: {
          completed: boolean
          created_at: string
          date: string
          fast_type: string
          id: string
          notes: string | null
          tarawih: boolean
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          date: string
          fast_type?: string
          id?: string
          notes?: string | null
          tarawih?: boolean
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          date?: string
          fast_type?: string
          id?: string
          notes?: string | null
          tarawih?: boolean
          user_id?: string
        }
        Relationships: []
      }
      game_sessions: {
        Row: {
          created_at: string
          current_turn: string | null
          game_type: string
          id: string
          invited_by: string
          invited_to: string
          state: Json
          status: string
          updated_at: string
          winner_id: string | null
        }
        Insert: {
          created_at?: string
          current_turn?: string | null
          game_type: string
          id?: string
          invited_by: string
          invited_to: string
          state?: Json
          status?: string
          updated_at?: string
          winner_id?: string | null
        }
        Update: {
          created_at?: string
          current_turn?: string | null
          game_type?: string
          id?: string
          invited_by?: string
          invited_to?: string
          state?: Json
          status?: string
          updated_at?: string
          winner_id?: string | null
        }
        Relationships: []
      }
      meals: {
        Row: {
          calories: number
          created_at: string
          date: string
          food_name: string
          id: string
          meal_type: string
          user_id: string
        }
        Insert: {
          calories?: number
          created_at?: string
          date: string
          food_name: string
          id?: string
          meal_type: string
          user_id: string
        }
        Update: {
          calories?: number
          created_at?: string
          date?: string
          food_name?: string
          id?: string
          meal_type?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      prayers: {
        Row: {
          ashar: boolean
          created_at: string
          date: string
          dzuhur: boolean
          id: string
          isya: boolean
          maghrib: boolean
          subuh: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          ashar?: boolean
          created_at?: string
          date: string
          dzuhur?: boolean
          id?: string
          isya?: boolean
          maghrib?: boolean
          subuh?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          ashar?: boolean
          created_at?: string
          date?: string
          dzuhur?: boolean
          id?: string
          isya?: boolean
          maghrib?: boolean
          subuh?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tadarus: {
        Row: {
          created_at: string
          date: string
          from_ayah: number | null
          id: string
          notes: string | null
          pages: number | null
          surah: string
          to_ayah: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          from_ayah?: number | null
          id?: string
          notes?: string | null
          pages?: number | null
          surah: string
          to_ayah?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          from_ayah?: number | null
          id?: string
          notes?: string | null
          pages?: number | null
          surah?: string
          to_ayah?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["couple_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["couple_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["couple_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          city: string | null
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          prayer_method: number
          push_subscription: Json | null
          sound_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          prayer_method?: number
          push_subscription?: Json | null
          sound_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          prayer_method?: number
          push_subscription?: Json | null
          sound_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["couple_role"]
      }
      user_id_for_role: {
        Args: { _role: Database["public"]["Enums"]["couple_role"] }
        Returns: string
      }
    }
    Enums: {
      couple_role: "tri" | "mutia"
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
      couple_role: ["tri", "mutia"],
    },
  },
} as const
