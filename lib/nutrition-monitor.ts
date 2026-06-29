import { DailyLog } from './supabase'
import { Macro, Meal, SWAP_OPTIONS, TARGETS, calcAdjustedTotals, getDayMeals } from './meals'

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

export interface QuickAddEntry extends Macro {
  id?: string
  date?: string
  name: string
  emoji?: string
}

export interface EatenEntry extends Macro {
  slot: string
  name: string
  source: 'meal' | 'quick_add' | 'manual'
}

export interface FoodAnalysis {
  date: string
  dayName: string
  eaten: EatenEntry[]
  totals: Macro
  headline: string
  positives: string[]
  watch: string[]
  suggestions: string[]
}

export const MONITOR_METRICS: Array<{ key: MetricKey; label: string; unit: string; target: number; invert?: boolean; color: string }> = [
  { key: 'cal', label: 'Calories', unit: 'cal', target: TARGETS.cal, color: 'var(--macro-cal)' },
  { key: 'protein', label: 'Protein', unit: 'g', target: TARGETS.protein, color: 'var(--macro-protein)' },
  { key: 'sodium', label: 'Sodium', unit: 'mg', target: TARGETS.sodium, invert: true, color: 'var(--macro-sodium)' },
  { key: 'fiber', label: 'Fiber', unit: 'g', target: TARGETS.fiber, color: 'var(--macro-fiber)' },
  { key: 'carbs', label: 'Carbs', unit: 'g', target: TARGETS.carbs, color: 'var(--macro-carbs)' },
]

function roundMacro(macro: Macro): Macro {
  return {
    cal: Math.round(macro.cal),
    protein: Math.round(macro.protein * 10) / 10,
    sodium: Math.round(macro.sodium),
    fiber: Math.round(macro.fiber * 10) / 10,
    carbs: Math.round(macro.carbs * 10) / 10,
  }
}

function addMacro(total: Macro, macro: Macro) {
  total.cal += macro.cal
  total.protein += macro.protein
  total.sodium += macro.sodium
  total.fiber += macro.fiber
  total.carbs += macro.carbs
}

function toEntry(slot: string, meal: Meal, source: EatenEntry['source'] = 'meal'): EatenEntry {
  return { slot, name: meal.name, source, ...roundMacro(meal.totals) }
}

function allSwapMeals() {
  const byId = new Map<string, Meal>()
  Object.values(SWAP_OPTIONS).flat().forEach((meal) => byId.set(meal.id, meal))
  return byId
}

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

export function getEatenEntries(log: DailyLog, quickAdds: QuickAddEntry[] = []) {
  const meals = getDayMeals(log.day_type, log.gym_day)
  const swaps = allSwapMeals()
  const entries: EatenEntry[] = []
  const dinner = log.dinner_swapped_to ? swaps.get(log.dinner_swapped_to) || meals.dinner : meals.dinner
  const lunch = log.lunch_swapped_to ? swaps.get(log.lunch_swapped_to) || meals.lunch : meals.lunch
  const customizations = (log.meal_customizations || {}) as Partial<Record<string, Record<number, number>>>
  const customizedEntry = (slot: string, key: string, meal: Meal) => {
    const multipliers = customizations[key]
    return multipliers && Object.keys(multipliers).length > 0
      ? { slot, name: meal.name, source: 'meal' as const, ...roundMacro(calcAdjustedTotals(meal, multipliers)) }
      : toEntry(slot, meal)
  }

  if (log.breakfast_confirmed) {
    if (log.breakfast_override) {
      entries.push({
        slot: 'Breakfast',
        name: 'Manual breakfast',
        source: 'manual',
        cal: log.breakfast_override_cal || 0,
        protein: log.breakfast_override_protein || 0,
        sodium: log.breakfast_override_sodium || 0,
        fiber: 0,
        carbs: 0,
      })
    } else {
      entries.push(customizedEntry('Breakfast', 'breakfast', meals.breakfast))
    }
  }
  if (log.lunch_confirmed && lunch) entries.push(customizedEntry('Lunch', 'lunch', lunch))
  if (log.shake_confirmed && meals.shake) entries.push(customizedEntry('Protein shake', 'shake', meals.shake))
  if (log.vita_coco_confirmed && meals.vitaCoco) entries.push(toEntry('Post-gym', meals.vitaCoco))
  if (log.dinner_confirmed && dinner) entries.push(customizedEntry('Dinner', 'dinner', dinner))
  if (log.snack_confirmed && meals.snack) entries.push(customizedEntry('Snack', 'snack', meals.snack))

  quickAdds.forEach((item) => {
    entries.push({
      slot: 'Quick add',
      name: `${item.emoji ? `${item.emoji} ` : ''}${item.name}`,
      source: 'quick_add',
      ...roundMacro(item),
    })
  })

  return entries
}

export function analyzeFoodDay(log: DailyLog, quickAdds: QuickAddEntry[] = []): FoodAnalysis {
  const eaten = getEatenEntries(log, quickAdds)
  const totals = roundMacro(eaten.reduce((acc, entry) => {
    addMacro(acc, entry)
    return acc
  }, { cal: 0, protein: 0, sodium: 0, fiber: 0, carbs: 0 }))
  const sodiumLeader = [...eaten].sort((a, b) => b.sodium - a.sodium)[0]
  const proteinLeader = [...eaten].sort((a, b) => b.protein - a.protein)[0]
  const fiberLeader = [...eaten].sort((a, b) => b.fiber - a.fiber)[0]
  const positives: string[] = []
  const watch: string[] = []
  const suggestions: string[] = []

  if (eaten.length === 0) {
    return {
      date: log.date,
      dayName: 'No meals logged',
      eaten,
      totals,
      headline: 'No eaten meals were confirmed for this day.',
      positives: [],
      watch: ['Nothing can be analyzed until at least one meal or quick add is logged.'],
      suggestions: ['Confirm meals as you eat them, or use Quick Add for anything outside the plan.'],
    }
  }

  if (totals.protein >= TARGETS.protein) positives.push(`Protein target hit, mostly from ${proteinLeader.name}.`)
  if (totals.sodium <= TARGETS.sodium) positives.push(`Sodium stayed under the ${TARGETS.sodium}mg ceiling.`)
  if (totals.fiber >= TARGETS.fiber) positives.push(`Fiber target hit, helped most by ${fiberLeader.name}.`)
  if (totals.cal <= TARGETS.cal) positives.push(`Calories stayed within the ${TARGETS.cal} target.`)

  if (totals.sodium > TARGETS.sodium) {
    watch.push(`Sodium crossed target by ${Math.round(totals.sodium - TARGETS.sodium)}mg; biggest source was ${sodiumLeader.name}.`)
    suggestions.push('Keep the next meal very low sodium: eggs, fruit, plain rice, avocado, unsalted vegetables, or no-salt dal.')
  } else if (totals.sodium > TARGETS.sodium * 0.85) {
    watch.push(`Sodium is close to the ceiling; ${sodiumLeader.name} contributed the most.`)
    suggestions.push('Avoid sauces, packaged snacks, salsa, cheese, and salted proteins for the rest of the day.')
  }

  if (totals.protein < TARGETS.protein) {
    watch.push(`Protein is short by ${Math.round(TARGETS.protein - totals.protein)}g.`)
    suggestions.push('Add a lean protein item such as Fairlife, tuna, chicken, Greek yogurt, eggs, or soya chunks.')
  }
  if (totals.fiber < TARGETS.fiber) {
    watch.push(`Fiber is short by ${Math.round((TARGETS.fiber - totals.fiber) * 10) / 10}g.`)
    suggestions.push('Add berries, chia/flax, beans, dal, vegetables, avocado, dates, or oranges.')
  }
  if (totals.cal > TARGETS.cal) {
    watch.push(`Calories are over target by ${Math.round(totals.cal - TARGETS.cal)}.`)
    suggestions.push('Keep any remaining food protein-forward and low-fat, or stop eating if hunger is settled.')
  }
  if (totals.carbs < TARGETS.carbs * 0.65 && log.gym_day) {
    watch.push('Carbs look low for a gym day.')
    suggestions.push('Add rice, fruit, dates, or coconut water around training.')
  }

  const headline = watch.length
    ? `${eaten.length} eaten item${eaten.length === 1 ? '' : 's'} logged. Main watch: ${watch[0]}`
    : `${eaten.length} eaten item${eaten.length === 1 ? '' : 's'} logged and the day looks on track.`

  return {
    date: log.date,
    dayName: `${log.day_type.replace(/_/g, ' ')}${log.gym_day ? ' gym day' : ' rest day'}`,
    eaten,
    totals,
    headline,
    positives,
    watch,
    suggestions: Array.from(new Set(suggestions)),
  }
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

export function buildDailyFoodSummary(analysis: FoodAnalysis) {
  const firstWatch = analysis.watch[0]
  return {
    title: firstWatch ? 'Daily food analysis' : 'Daily food recap',
    body: firstWatch
      ? `${formatMonitorDate(analysis.date)}: ${firstWatch}`
      : `${formatMonitorDate(analysis.date)}: ${analysis.eaten.length} eaten item${analysis.eaten.length === 1 ? '' : 's'} logged and on track.`,
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
