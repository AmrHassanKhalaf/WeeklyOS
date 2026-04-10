export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          api_key?: string
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
      tasks: {
        Row: {
          created_at: string
          day: string | null
          description: string | null
          estimated_duration: string | null
          id: string
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
          created_at?: string
          day?: string | null
          description?: string | null
          estimated_duration?: string | null
          id?: string
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
          created_at?: string
          day?: string | null
          description?: string | null
          estimated_duration?: string | null
          id?: string
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
            foreignKeyName: "tasks_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          analytics_enabled: boolean | null
          daily_reminders: boolean | null
          fallback_enabled: boolean | null
          rest_days: Json | null
          theme: string | null
          updated_at: string | null
          user_id: string
          weekly_summaries: boolean | null
        }
        Insert: {
          analytics_enabled?: boolean | null
          daily_reminders?: boolean | null
          fallback_enabled?: boolean | null
          rest_days?: Json | null
          theme?: string | null
          updated_at?: string | null
          user_id: string
          weekly_summaries?: boolean | null
        }
        Update: {
          analytics_enabled?: boolean | null
          daily_reminders?: boolean | null
          fallback_enabled?: boolean | null
          rest_days?: Json | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string
          weekly_summaries?: boolean | null
        }
        Relationships: []
      }
      weeks: {
        Row: {
          activities: Json | null
          challenge_completed: boolean | null
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
          score: number | null
          user_id: string
          week_number: number
          year: number
        }
        Insert: {
          activities?: Json | null
          challenge_completed?: boolean | null
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
          score?: number | null
          user_id: string
          week_number: number
          year: number
        }
        Update: {
          activities?: Json | null
          challenge_completed?: boolean | null
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
          score?: number | null
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
