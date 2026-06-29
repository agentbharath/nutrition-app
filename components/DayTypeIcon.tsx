import { BowlIcon, DumbbellIcon, HomeIcon, LeafIcon } from './Icons'
import type { DayType } from '@/lib/supabase'

export default function DayTypeIcon({ dayType, size = 18 }: { dayType?: DayType | string; size?: number }) {
  if (dayType === 'office') return <DumbbellIcon size={size} />
  if (dayType === 'sunday_fast') return <LeafIcon size={size} />
  if (dayType === 'wfh_chana' || dayType === 'wfh_soya' || dayType === 'wfh_chipotle') return <BowlIcon size={size} />
  return <HomeIcon size={size} />
}
