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
      candidates: {
        Row: {
          created_at: string
          file_name: string
          file_path: string | null
          file_size: number | null
          file_type: string
          file_url: string | null
          id: string
          job_id: string
          processed_resume: Json
          updated_at: string
          upload_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path?: string | null
          file_size?: number | null
          file_type: string
          file_url?: string | null
          id?: string
          job_id: string
          processed_resume: Json
          updated_at?: string
          upload_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string | null
          file_size?: number | null
          file_type?: string
          file_url?: string | null
          id?: string
          job_id?: string
          processed_resume?: Json
          updated_at?: string
          upload_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidates_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          candidate_id: string
          created_at: string
          hr_notes: string | null
          id: string
          job_id: string
          matching_score: number | null
          ranking: number | null
          reviewed_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          hr_notes?: string | null
          id?: string
          job_id: string
          matching_score?: number | null
          ranking?: number | null
          reviewed_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          hr_notes?: string | null
          id?: string
          job_id?: string
          matching_score?: number | null
          ranking?: number | null
          reviewed_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          company: string | null
          created_at: string
          employment_type: string | null
          experience_level: string | null
          formatted_jd: Json | null
          id: string
          location: string | null
          raw_description: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          employment_type?: string | null
          experience_level?: string | null
          formatted_jd?: Json | null
          id?: string
          location?: string | null
          raw_description: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string
          employment_type?: string | null
          experience_level?: string | null
          formatted_jd?: Json | null
          id?: string
          location?: string | null
          raw_description?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          credits_remaining: number
          expires_at: string | null
          id: string
          plan_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_remaining?: number
          expires_at?: string | null
          id?: string
          plan_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_remaining?: number
          expires_at?: string | null
          id?: string
          plan_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      process_expired_subscriptions: {
        Args: {}
        Returns: {
          processed_count: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

// Helper types for our specific tables
export type Job = Tables<'jobs'>
export type JobInsert = TablesInsert<'jobs'>
export type JobUpdate = TablesUpdate<'jobs'>

export type Candidate = Tables<'candidates'>
export type CandidateInsert = TablesInsert<'candidates'>
export type CandidateUpdate = TablesUpdate<'candidates'>

export type JobApplication = Tables<'job_applications'>
export type JobApplicationInsert = TablesInsert<'job_applications'>
export type JobApplicationUpdate = TablesUpdate<'job_applications'>

export type User = Tables<'users'>
export type Subscription = Tables<'subscriptions'>

// Status enums
export type JobStatus = 'draft' | 'active' | 'closed'
export type ApplicationStatus = 'pending' | 'under_review' | 'rejected' | 'interviewed' | 'hired'

export const Constants = {
  public: {
    Enums: {},
  },
} as const
 