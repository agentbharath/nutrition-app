import { DailyLog } from './supabase'
import { TARGETS } from './meals'

export type MetricKey = 'cal' | 'protein' | 'sodium' | 'fiber' | 'carbs'

export interface MonitorDay {
  date: string
  cal: number
  protein: number
  sodium: number
  fiber: number
  carbs: number
  complete: boolean
}

export const MONITOR_METRICS: Array<{ key: MetricKey; label: string; unit: string; target: number; invert?: boolean; color: string }> = [
  { key: 'cal', label: 'Calories', unit: 'cal', target: TARGETS.cal, color: 'var(--macro-cal)' },
  { key: 'protein', label: 'Protein', unit: 'g', target: TARGETS.protein, color: 'var(--macro-protein)' },
  { key: 'sodium', label: 'Sodium', unit: 'mg', target: TARGETS.sodium, invert: true, color: 'var(--macro-sodium)' },
  { key: 'fiber', label: 'Fiber', unit: 'g', target: TARGETS.fiber, color: 'var(--macro-fiber)' },
  { key: 'carbs', label: 'Carbs', unit: 'g', target: TARGETS.carbs, color: 'var(--macro-carbs)' },
]

export function valueFor(log: DailyLog, key: MetricKey) {
  const consumed = log[`${key}_consumed` as keyof DailyLog]
  const planned = log[`${key}_total` as keyof DailyLog]
  return Number(consumed || planned || 0)
}

export function toMonitorDay(log: DailyLog): MonitorDay {
  return {
    date: log.date,
    cal: valueFor(log, 'cal'),
    protein: valueFor(log, 'protein'),
    sodium: valueFor(log, 'sodium'),
    fiber: valueFor(log, 'fiber'),
    carbs: valueFor(log, 'carbs'),
    complete: Boolean(log.breakfast_confirmed || log.lunch_confirmed || log.dinner_confirmed || log.shake_confirmed || log.snack_confirmed),
  }
}

export function average(days: MonitorDay[], key: MetricKey) {
  if (days.length === 0) return 0
  return days.reduce((sum, day) => sum + day[key], 0) / days.length
}

export function hitRate(days: MonitorDay[], key: MetricKey, invert?: boolean) {
  if (days.length === 0) return 0
  const hits = days.filter((day) => invert ? day[key] <= TARGETS[key] : day[key] >= TARGETS[key]).length
  return Math.round((hits / days.length) * 100)
}

export function weeklyScore(days: MonitorDay[]) {
  if (days.length === 0) return 0
  return Math.round(MONITOR_METRICS.reduce((score, metric) => score + hitRate(days, metric.key, metric.invert), 0) / MONITOR_METRICS.length)
}

export function riskIssues(day: MonitorDay) {
  return [
    day.sodium > TARGETS.sodium ? 'sodium over' : '',
    day.protein < TARGETS.protein ? 'protein low' : '',
    day.fiber < TARGETS.fiber ? 'fiber low' : '',
  ].filter(Boolean)
}

export function formatMonitorDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function getPacificDate(offsetDays = 0) {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() + offsetDays)
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value
  return `${year}-${month}-${day}`
}

export function buildDailySummary(day: MonitorDay) {
  const issues = riskIssues(day)
  return {
    title: issues.length ? 'Daily nutrition watch' : 'Daily nutrition recap',
    body: `${formatMonitorDate(day.date)}: ${Math.round(day.cal)} cal, ${Math.round(day.protein)}g P, ${Math.round(day.sodium)}mg Na, ${Math.round(day.fiber)}g fiber.${issues.length ? ` Watch: ${issues.join(', ')}.` : ' On track.'}`,
  }
}

export function buildWeeklySummary(days: MonitorDay[]) {
  const sortedDays = [...days].sort((a, b) => a.date.localeCompare(b.date))
  const score = weeklyScore(sortedDays)
  const sodiumHits = hitRate(sortedDays, 'sodium', true)
  const proteinHits = hitRate(sortedDays, 'protein')
  const fiberHits = hitRate(sortedDays, 'fiber')
  const strongest = [
    { label: 'protein', value: proteinHits },
    { label: 'sodium', value: sodiumHits },
    { label: 'fiber', value: fiberHits },
  ].sort((a, b) => b.value - a.value)[0]
  const watch = [
    proteinHits < 70 ? 'protein' : '',
    sodiumHits < 70 ? 'sodium' : '',
    fiberHits < 70 ? 'fiber' : '',
  ].filter(Boolean)

  return {
    title: 'Weekly nutrition report',
    body: `${score}% weekly score across ${sortedDays.length} days. Best: ${strongest.label} (${strongest.value}% hit).${watch.length ? ` Watch next week: ${watch.join(', ')}.` : ' No major watch items.'}`,
  }
}
