/**
 * PocketBase Collection Types for PagePerfect
 *
 * Collections (set up in PocketBase Admin UI → pb.pageperfect.studio/_/):
 *
 *   users (built-in auth collection) — extended with custom fields:
 *     - display_name: text
 *     - tier: select (drafter | publisher | studio), default "drafter"
 *     - pdf_credits: number, default 0 (Publisher purchases increment this)
 *     - stripe_customer_id: text
 *     - stripe_subscription_id: text
 *
 *   manuscripts — user manuscripts:
 *     - user: relation → users
 *     - title: text
 *     - content: text (long)
 *     - template: text, default "symphony"
 *     - page_size: text, default "letter"
 *     - margin_preset: text, default "normal"
 *     - safe_mode: boolean, default false
 *
 *   compile_history — compilation logs:
 *     - user: relation → users (optional)
 *     - template: text
 *     - page_size: text
 *     - margin_preset: text
 *     - compile_mode: text
 *     - safe_mode: boolean
 *     - status: select (success | error | timeout)
 *     - compile_time_ms: number
 *     - error_message: text (optional)
 */

export type Tier = 'drafter' | 'single' | 'publisher' | 'studio'

export interface UserRecord {
  id: string
  email: string
  name: string
  display_name: string | null
  tier: Tier
  pdf_credits: number
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  created: string
  updated: string
}

export interface ManuscriptRecord {
  id: string
  user: string
  title: string
  content: string
  template: string
  page_size: string
  margin_preset: string
  safe_mode: boolean
  created: string
  updated: string
}

export interface CompileHistoryRecord {
  id: string
  user: string | null
  template: string
  page_size: string
  margin_preset: string
  compile_mode: string
  safe_mode: boolean
  status: 'success' | 'error' | 'timeout'
  compile_time_ms: number
  error_message: string | null
  created: string
}
