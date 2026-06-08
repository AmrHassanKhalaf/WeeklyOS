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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ai_keys: {
        Row: {
          api_key: string
          created_at: string
          id: string
          is_active: boolean
          provider: string
          user_id: string
          vault_secret_id: string | null
        }
        Insert: {
          api_key: string
          created_at?: string
          id?: string
          is_active?: boolean
          provider: string
          user_id: string
          vault_secret_id?: string | null
        }
        Update: {
          api_key?: string
          created_at?: string
          id?: string
          is_active?: boolean
          provider?: string
          user_id?: string
          vault_secret_id?: string | null
        }
        Relationships: []
      }
      ai_settings: {
        Row: {
          active_model: string | null
          default_provider: string | null
          fallback_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          active_model?: string | null
          default_provider?: string | null
          fallback_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          active_model?: string | null
          default_provider?: string | null
          fallback_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      brain_dump: {
        Row: {
          content: string | null
          created_at: string
          id: string
          tags: string[] | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          tags?: string[] | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          tags?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      habits: {
        Row: {
          id: string
          user_id: string
          name: string
          type: string
          difficulty: string
          group_label: string
          motivation: string | null
          color: string | null
          is_active: boolean
          month: number
          year: number
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type?: string
          difficulty?: string
          group_label?: string
          motivation?: string | null
          color?: string | null
          is_active?: boolean
          month: number
          year: number
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: string
          difficulty?: string
          group_label?: string
          motivation?: string | null
          color?: string | null
          is_active?: boolean
          month?: number
          year?: number
          sort_order?: number
          created_at?: string
        }
        Relationships: []
      }
      habit_completions: {
        Row: {
          id: string
          user_id: string
          habit_id: string
          day: number
          month: number
          year: number
          completed_at: string
        }
        Insert: {
          id?: string
          user_id: string
          habit_id: string
          day: number
          month: number
          year: number
          completed_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          habit_id?: string
          day?: number
          month?: number
          year?: number
          completed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_completions_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          }
        ]
      }
      focus_sessions: {
        Row: {
          created_at: string | null
          duration_seconds: number
          end_time: string | null
          id: string
          session_type: string | null
          start_time: string
          task_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          duration_seconds: number
          end_time?: string | null
          id?: string
          session_type?: string | null
          start_time: string
          task_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number
          end_time?: string | null
          id?: string
          session_type?: string | null
          start_time?: string
          task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "focus_sessions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      pinned_tasks: {
        Row: {
          created_at: string
          day_of_week: string
          description: string | null
          end_time: string | null
          id: string
          is_active: boolean
          priority: string
          start_time: string | null
          tags: string[] | null
          title: string
          until_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_of_week: string
          description?: string | null
          end_time?: string | null
          id?: string
          is_active?: boolean
          priority?: string
          start_time?: string | null
          tags?: string[] | null
          title: string
          until_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: string
          description?: string | null
          end_time?: string | null
          id?: string
          is_active?: boolean
          priority?: string
          start_time?: string | null
          tags?: string[] | null
          title?: string
          until_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          actual_duration: number | null
          created_at: string
          day: string | null
          description: string | null
          estimated_duration: string | null
          id: string
          pinned_task_id: string | null
          priority: string | null
          start_time: string | null
          status: string
          tags: string[] | null
          title: string
          type: string | null
          user_id: string
          week_id: string | null
        }
        Insert: {
          actual_duration?: number | null
          created_at?: string
          day?: string | null
          description?: string | null
          estimated_duration?: string | null
          id?: string
          pinned_task_id?: string | null
          priority?: string | null
          start_time?: string | null
          status?: string
          tags?: string[] | null
          title: string
          type?: string | null
          user_id: string
          week_id?: string | null
        }
        Update: {
          actual_duration?: number | null
          created_at?: string
          day?: string | null
          description?: string | null
          estimated_duration?: string | null
          id?: string
          pinned_task_id?: string | null
          priority?: string | null
          start_time?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          type?: string | null
          user_id?: string
          week_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_pinned_task_id_fkey"
            columns: ["pinned_task_id"]
            isOneToOne: false
            referencedRelation: "pinned_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_feedback: {
        Row: {
          created_at: string
          id: string
          message: string
          status: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          status?: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          analytics_enabled: boolean | null
          auto_download_completed_week_report: boolean | null
          daily_reminders: boolean | null
          fallback_enabled: boolean | null
          pomodoro_break_min: number | null
          pomodoro_focus_min: number | null
          report_closing_quote: string | null
          report_included_days: string[] | null
          rest_days: Json | null
          theme: string | null
          timezone: string | null
          updated_at: string | null
          user_id: string
          week_start_day: string | null
          weekly_summaries: boolean | null
        }
        Insert: {
          analytics_enabled?: boolean | null
          auto_download_completed_week_report?: boolean | null
          daily_reminders?: boolean | null
          fallback_enabled?: boolean | null
          pomodoro_break_min?: number | null
          pomodoro_focus_min?: number | null
          report_closing_quote?: string | null
          report_included_days?: string[] | null
          rest_days?: Json | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
          week_start_day?: string | null
          weekly_summaries?: boolean | null
        }
        Update: {
          analytics_enabled?: boolean | null
          auto_download_completed_week_report?: boolean | null
          daily_reminders?: boolean | null
          fallback_enabled?: boolean | null
          pomodoro_break_min?: number | null
          pomodoro_focus_min?: number | null
          report_closing_quote?: string | null
          report_included_days?: string[] | null
          rest_days?: Json | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
          week_start_day?: string | null
          weekly_summaries?: boolean | null
        }
        Relationships: []
      }
      weeks: {
        Row: {
          activities: Json | null
          challenge_completed: boolean | null
          challenge_days: Json | null
          challenge_description: string | null
          challenge_ends_in: string | null
          challenge_progress: number | null
          challenge_title: string | null
          created_at: string
          daily_notes: Json | null
          eval_lessons: string | null
          eval_struggle: string | null
          eval_went_well: string | null
          id: string
          overview_note: string | null
          score: number | null
          title: string | null
          user_id: string
          week_number: number
          year: number
        }
        Insert: {
          activities?: Json | null
          challenge_completed?: boolean | null
          challenge_days?: Json | null
          challenge_description?: string | null
          challenge_ends_in?: string | null
          challenge_progress?: number | null
          challenge_title?: string | null
          created_at?: string
          daily_notes?: Json | null
          eval_lessons?: string | null
          eval_struggle?: string | null
          eval_went_well?: string | null
          id?: string
          overview_note?: string | null
          score?: number | null
          title?: string | null
          user_id: string
          week_number: number
          year: number
        }
        Update: {
          activities?: Json | null
          challenge_completed?: boolean | null
          challenge_days?: Json | null
          challenge_description?: string | null
          challenge_ends_in?: string | null
          challenge_progress?: number | null
          challenge_title?: string | null
          created_at?: string
          daily_notes?: Json | null
          eval_lessons?: string | null
          eval_struggle?: string | null
          eval_went_well?: string | null
          id?: string
          overview_note?: string | null
          score?: number | null
          title?: string | null
          user_id?: string
          week_number?: number
          year?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
