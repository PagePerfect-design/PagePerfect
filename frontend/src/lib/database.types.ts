/**
 * PocketBase Collection Types for PagePerfect
 *
 * Collections (set up in PocketBase Admin UI → pb.pageperfect.studio/_/):
 *
 *   users (built-in auth collection) — extended with custom fields:
 *     - display_name: text
 *     - tier: select (drafter | publisher | studio), default "drafter"
 *     - pdf_credits: number, default 0 (deprecated — unused, kept in schema)
 *     - stripe_customer_id: text
 *     - stripe_subscription_id: text
 *
 *     - publisher_window_end: datetime (nullable) — 14-day export window expiry
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
 *
 *   print_orders — Lulu print-on-demand order tracking:
 *     - user: relation → users (optional)
 *     - lulu_job_id: text (unique, indexed)
 *     - status: text (CREATED | UNPAID | PAYMENT_IN_PROGRESS | PRODUCTION_READY |
 *                      PRODUCTION_DELAYED | IN_PRODUCTION | SHIPPED | REJECTED | CANCELLED | ERROR)
 *     - status_message: text (optional)
 *     - tracking_info: text (optional)
 *     - raw_event: json (optional — last webhook payload)
 */

export type Tier = 'drafter' | 'publisher' | 'studio'

export interface UserRecord {
  id: string
  email: string
  name: string
  display_name: string | null
  tier: Tier
  pdf_credits: number
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  publisher_window_end: string | null
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

export type LuluOrderStatus =
  | 'CREATED' | 'UNPAID' | 'PAYMENT_IN_PROGRESS' | 'PRODUCTION_READY'
  | 'PRODUCTION_DELAYED' | 'IN_PRODUCTION' | 'SHIPPED'
  | 'REJECTED' | 'CANCELLED' | 'ERROR'

export interface PrintOrderRecord {
  id: string
  user: string | null
  lulu_job_id: string
  status: LuluOrderStatus
  status_message: string | null
  tracking_info: string | null
  raw_event: string | null
  created: string
  updated: string
}
