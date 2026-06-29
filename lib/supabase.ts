import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export type DayType = 'wfh_regular' | 'wfh_soya' | 'wfh_chana' | 'wfh_chipotle' | 'office' | 'sunday_fast'

export interface DailyLog {
  id?: string
  date: string
  day_type: DayType
  gym_day: boolean
  breakfast_confirmed: boolean
  breakfast_override: boolean
  breakfast_override_cal?: number
  breakfast_override_protein?: number
  breakfast_override_sodium?: number
  lunch_confirmed: boolean
  dinner_confirmed: boolean
  shake_confirmed?: boolean
  vita_coco_confirmed?: boolean
  snack_confirmed?: boolean
  lunch_swapped_to?: string
  dinner_swapped_to?: string
  cal_total: number
  protein_total: number
  sodium_total: number
  fiber_total: number
  carbs_total: number
  cal_consumed?: number
  protein_consumed?: number
  sodium_consumed?: number
  fiber_consumed?: number
  carbs_consumed?: number
  meal_customizations?: unknown
  notes?: string
}

export interface NutritionAiReport {
  id?: string
  report_type: 'daily' | 'weekly'
  period_start: string
  period_end: string
  model: string
  analysis: unknown
  input_snapshot?: unknown
  created_at?: string
  updated_at?: string
}

export interface HealthDailyMetrics {
  id?: string
  provider: 'google_health' | 'fitbit'
  date: string
  steps?: number | null
  calories_out?: number | null
  activity_calories?: number | null
  lightly_active_minutes?: number | null
  fairly_active_minutes?: number | null
  very_active_minutes?: number | null
  active_minutes?: number | null
  active_zone_minutes?: number | null
  resting_heart_rate?: number | null
  sleep_minutes?: number | null
  sleep_efficiency?: number | null
  weight_kg?: number | null
  body_fat_pct?: number | null
}
