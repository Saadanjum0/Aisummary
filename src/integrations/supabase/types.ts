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
      ai_usage: {
        Row: {
          created_at: string | null
          id: string
          model_used: string | null
          note_id: string | null
          operation_type: string
          request_data: Json | null
          response_data: Json | null
          tokens_used: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          model_used?: string | null
          note_id?: string | null
          operation_type: string
          request_data?: Json | null
          response_data?: Json | null
          tokens_used: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          model_used?: string | null
          note_id?: string | null
          operation_type?: string
          request_data?: Json | null
          response_data?: Json | null
          tokens_used?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "user_notes_with_tags"
            referencedColumns: ["note_id"]
          },
          {
            foreignKeyName: "ai_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcard_deck_items: {
        Row: {
          created_at: string | null
          deck_id: string
          flashcard_id: string
          id: string
          position: number
        }
        Insert: {
          created_at?: string | null
          deck_id: string
          flashcard_id: string
          id?: string
          position: number
        }
        Update: {
          created_at?: string | null
          deck_id?: string
          flashcard_id?: string
          id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "flashcard_deck_items_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "flashcard_decks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcard_deck_items_flashcard_id_fkey"
            columns: ["flashcard_id"]
            isOneToOne: false
            referencedRelation: "flashcards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcard_deck_items_flashcard_id_fkey"
            columns: ["flashcard_id"]
            isOneToOne: false
            referencedRelation: "flashcards_due_for_review"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcard_decks: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcard_decks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcards: {
        Row: {
          answer: string
          created_at: string | null
          difficulty_rating: number | null
          highlight_id: string | null
          id: string
          is_auto_generated: boolean | null
          last_reviewed: string | null
          next_review_date: string | null
          note_id: string | null
          question: string
          review_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          answer: string
          created_at?: string | null
          difficulty_rating?: number | null
          highlight_id?: string | null
          id?: string
          is_auto_generated?: boolean | null
          last_reviewed?: string | null
          next_review_date?: string | null
          note_id?: string | null
          question: string
          review_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          answer?: string
          created_at?: string | null
          difficulty_rating?: number | null
          highlight_id?: string | null
          id?: string
          is_auto_generated?: boolean | null
          last_reviewed?: string | null
          next_review_date?: string | null
          note_id?: string | null
          question?: string
          review_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_highlight_id_fkey"
            columns: ["highlight_id"]
            isOneToOne: false
            referencedRelation: "highlights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcards_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcards_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "user_notes_with_tags"
            referencedColumns: ["note_id"]
          },
          {
            foreignKeyName: "flashcards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      highlights: {
        Row: {
          color: string | null
          comment: string | null
          content: string
          context: string | null
          created_at: string | null
          id: string
          note_id: string
          position_end: number | null
          position_start: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          comment?: string | null
          content: string
          context?: string | null
          created_at?: string | null
          id?: string
          note_id: string
          position_end?: number | null
          position_start?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          comment?: string | null
          content?: string
          context?: string | null
          created_at?: string | null
          id?: string
          note_id?: string
          position_end?: number | null
          position_start?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "highlights_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "highlights_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "user_notes_with_tags"
            referencedColumns: ["note_id"]
          },
          {
            foreignKeyName: "highlights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      import_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          metadata: Json | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          metadata?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          metadata?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      note_relations: {
        Row: {
          confidence: number | null
          created_at: string | null
          id: string
          is_auto_generated: boolean | null
          relation_type: string | null
          source_note_id: string
          target_note_id: string
          updated_at: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          id?: string
          is_auto_generated?: boolean | null
          relation_type?: string | null
          source_note_id: string
          target_note_id: string
          updated_at?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          id?: string
          is_auto_generated?: boolean | null
          relation_type?: string | null
          source_note_id?: string
          target_note_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "note_relations_source_note_id_fkey"
            columns: ["source_note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_relations_source_note_id_fkey"
            columns: ["source_note_id"]
            isOneToOne: false
            referencedRelation: "user_notes_with_tags"
            referencedColumns: ["note_id"]
          },
          {
            foreignKeyName: "note_relations_target_note_id_fkey"
            columns: ["target_note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_relations_target_note_id_fkey"
            columns: ["target_note_id"]
            isOneToOne: false
            referencedRelation: "user_notes_with_tags"
            referencedColumns: ["note_id"]
          },
        ]
      }
      note_tags: {
        Row: {
          confidence: number | null
          created_at: string | null
          id: string
          is_auto_assigned: boolean | null
          note_id: string
          tag_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          id?: string
          is_auto_assigned?: boolean | null
          note_id: string
          tag_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          id?: string
          is_auto_assigned?: boolean | null
          note_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_tags_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_tags_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "user_notes_with_tags"
            referencedColumns: ["note_id"]
          },
          {
            foreignKeyName: "note_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          ai_key_points: Json | null
          ai_processed: boolean | null
          ai_summary: string | null
          content: string | null
          created_at: string | null
          id: string
          is_archived: boolean | null
          is_favorite: boolean | null
          is_imported: boolean | null
          last_viewed_at: string | null
          metadata: Json | null
          original_content: string | null
          source_file_path: string | null
          source_file_type: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_key_points?: Json | null
          ai_processed?: boolean | null
          ai_summary?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_archived?: boolean | null
          is_favorite?: boolean | null
          is_imported?: boolean | null
          last_viewed_at?: string | null
          metadata?: Json | null
          original_content?: string | null
          source_file_path?: string | null
          source_file_type?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_key_points?: Json | null
          ai_processed?: boolean | null
          ai_summary?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_archived?: boolean | null
          is_favorite?: boolean | null
          is_imported?: boolean | null
          last_viewed_at?: string | null
          metadata?: Json | null
          original_content?: string | null
          source_file_path?: string | null
          source_file_type?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_user_id_fkey"
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
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          last_active: string | null
          onboarding_completed: boolean | null
          preferences: Json | null
          storage_used: number | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          last_active?: string | null
          onboarding_completed?: boolean | null
          preferences?: Json | null
          storage_used?: number | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          last_active?: string | null
          onboarding_completed?: boolean | null
          preferences?: Json | null
          storage_used?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      search_history: {
        Row: {
          created_at: string | null
          id: string
          query: string
          result_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          query: string
          result_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          query?: string
          result_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "search_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          is_auto_generated: boolean | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_auto_generated?: boolean | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_auto_generated?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      flashcards_due_for_review: {
        Row: {
          answer: string | null
          difficulty_rating: number | null
          id: string | null
          next_review_date: string | null
          note_title: string | null
          question: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notes_with_tags: {
        Row: {
          ai_summary: string | null
          created_at: string | null
          is_archived: boolean | null
          is_favorite: boolean | null
          note_id: string | null
          status: string | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
