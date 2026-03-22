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
        }
        Insert: {
          api_key: string
          created_at?: string
          id?: string
          is_active?: boolean
          provider: string
          user_id: string
        }
        Update: {
          api_key?: string
          created_at?: string
          id?: string
          is_active?: boolean
          provider?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_settings: {
        Row: {
          default_provider: string | null
          fallback_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          default_provider?: string | null
          fallback_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
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
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_logs: {
        Row: {
          date: string
          id: string
          notes: string | null
          rating: number | null
          tasks_completed: number
          tasks_total: number
          user_id: string
        }
        Insert: {
          date: string
          id?: string
          notes?: string | null
          rating?: number | null
          tasks_completed?: number
          tasks_total?: number
          user_id: string
        }
        Update: {
          date?: string
          id?: string
          notes?: string | null
          rating?: number | null
          tasks_completed?: number
          tasks_total?: number
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          created_at: string
          day: string | null
          description: string | null
          id: string
          priority: string | null
          status: string
          title: string
          type: string | null
          user_id: string
          week_id: string | null
        }
        Insert: {
          created_at?: string
          day?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          status?: string
          title: string
          type?: string | null
          user_id: string
          week_id?: string | null
        }
        Update: {
          created_at?: string
          day?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          status?: string
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
      weeks: {
        Row: {
          created_at: string
          id: string
          score: number | null
          user_id: string
          week_number: number
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          score?: number | null
          user_id: string
          week_number: number
          year: number
        }
        Update: {
          created_at?: string
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

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"]
