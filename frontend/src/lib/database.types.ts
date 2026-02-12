/**
 * Supabase Database Types for PagePerfect
 *
 * Tables:
 *   profiles        — User profile + tier info (synced from auth.users)
 *   manuscripts     — Saved manuscripts per user
 *   compile_history — Compilation logs for analytics + debugging
 *
 * To regenerate after schema changes:
 *   npx supabase gen types typescript --project-id <id> > src/lib/database.types.ts
 */

export type Tier = 'drafter' | 'publisher' | 'studio'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          tier: Tier
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          tier?: Tier
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
        }
        Update: {
          display_name?: string | null
          tier?: Tier
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
      }
      manuscripts: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          template: string
          page_size: string
          margin_preset: string
          safe_mode: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: string
          template?: string
          page_size?: string
          margin_preset?: string
          safe_mode?: boolean
        }
        Update: {
          title?: string
          content?: string
          template?: string
          page_size?: string
          margin_preset?: string
          safe_mode?: boolean
          updated_at?: string
        }
      }
      compile_history: {
        Row: {
          id: string
          user_id: string | null
          template: string
          page_size: string
          margin_preset: string
          compile_mode: string
          safe_mode: boolean
          status: 'success' | 'error' | 'timeout'
          compile_time_ms: number
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          template: string
          page_size: string
          margin_preset: string
          compile_mode: string
          safe_mode: boolean
          status: 'success' | 'error' | 'timeout'
          compile_time_ms: number
          error_message?: string | null
        }
        Update: never
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      tier: Tier
    }
  }
}
