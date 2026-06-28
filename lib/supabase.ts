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
  lunch_swapped_to?: string
  dinner_swapped_to?: string
  cal_total: number
  protein_total: number
  sodium_total: number
  fiber_total: number
  carbs_total: number
  notes?: string
}
