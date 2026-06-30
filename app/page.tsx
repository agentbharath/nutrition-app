'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase, DayType, DailyLog } from '@/lib/supabase'
import { DAY_TYPE_OPTIONS, getDayMeals, calculateDayTotals, TARGETS, SWAP_OPTIONS, Macro, calcAdjustedTotals } from '@/lib/meals'
import ProgressRing from '@/components/ProgressRing'
import MealCard from '@/components/MealCard'
import DaySelector from '@/components/DaySelector'
import SwapModal from '@/components/SwapModal'
import BreakfastOverride from '@/components/BreakfastOverride'
import QuickAdd from '@/components/QuickAdd'
import ThemeCelebration from '@/components/ThemeCelebration'
import BottomNav from '@/components/BottomNav'
import { CalendarIcon, ClipboardIcon, DumbbellIcon, LeafIcon, PlusIcon } from '@/components/Icons'
import DayTypeIcon from '@/components/DayTypeIcon'
import { useTheme } from '@/lib/theme'
import Link from 'next/link'

function getTodayDate() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })
}
function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

interface QuickItem { id?: string; name: string; emoji: string; cal: number; protein: number; sodium: number; carbs: number; fiber: number }
interface StoredQuickItem extends QuickItem { created_at?: string }

type MealKey = 'breakfast' | 'lunch' | 'shake' | 'vita_coco' | 'dinner' | 'snack'
type CelebrationMetric = 'cal' | 'protein' | 'fiber' | 'carbs'

function quickAddSignature(item: QuickItem) {
  return [
    item.name.trim().toLowerCase(),
    item.emoji,
    Math.round(item.cal * 10) / 10,
    Math.round(item.protein * 10) / 10,
    Math.round(item.sodium),
    Math.round(item.carbs * 10) / 10,
    Math.round(item.fiber * 10) / 10,
  ].join('|')
}

function dedupeQuickAdds(items: StoredQuickItem[]) {
  const seen = new Map<string, StoredQuickItem>()
  const unique: StoredQuickItem[] = []
  const duplicateIds: string[] = []

  items.forEach((item) => {
    const signature = quickAddSignature(item)
    const previous = seen.get(signature)
    const itemTime = item.created_at ? new Date(item.created_at).getTime() : 0
    const previousTime = previous?.created_at ? new Date(previous.created_at).getTime() : 0
    const isRetryDuplicate = Boolean(previous && itemTime && previousTime && Math.abs(itemTime - previousTime) <= 15000)

    if (isRetryDuplicate) {
      if (item.id) duplicateIds.push(item.id)
      return
    }

    seen.set(signature, item)
    unique.push(item)
  })

  return { unique, duplicateIds }
}

export default function Home() {
  const { theme } = useTheme()
  const [log, setLog] = useState<DailyLog | null>(null)
  const [quickAdds, setQuickAdds] = useState<QuickItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showDaySelector, setShowDaySelector] = useState(false)
  const [showSwap, setShowSwap] = useState<'lunch'|'dinner'|null>(null)
  const [showBreakfastOverride, setShowBreakfastOverride] = useState(false)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [celebration, setCelebration] = useState<CelebrationMetric | null>(null)
  const quickAddInFlight = useRef(new Set<string>())
  const completedRings = useRef<Partial<Record<CelebrationMetric, boolean>>>({})
  const hasTrackedRingState = useRef(false)
  // Per-meal adjusted totals (from quantity editing)
  const [adjustedTotals, setAdjustedTotals] = useState<Partial<Record<MealKey, Macro>>>({})
  // Per-meal multipliers (persisted)
  const [mealMultipliers, setMealMultipliers] = useState<Partial<Record<MealKey, Record<number, number>>>>({})
  const today = getTodayDate()

  const fetchLog = useCallback(async () => {
    const { data } = await supabase.from('daily_logs').select('*').eq('date', today).maybeSingle()
    setLog(data)

    if (data?.meal_customizations && data.day_type) {
      const savedMultipliers = data.meal_customizations as Partial<Record<MealKey, Record<number, number>>>
      setMealMultipliers(savedMultipliers)

      // Restore adjusted totals from saved multipliers
      const dayMeals = getDayMeals(data.day_type as DayType, data.gym_day)
      const mealMap: Partial<Record<MealKey, any>> = {
        breakfast: dayMeals.breakfast,
        lunch: dayMeals.lunch,
        shake: dayMeals.shake,
        vita_coco: dayMeals.vitaCoco,
        dinner: dayMeals.dinner,
        snack: dayMeals.snack,
      }
      const restored: Partial<Record<MealKey, Macro>> = {}
      for (const [key, multipliers] of Object.entries(savedMultipliers)) {
        const meal = mealMap[key as MealKey]
        if (meal && multipliers && Object.keys(multipliers).length > 0) {
          restored[key as MealKey] = calcAdjustedTotals(meal, multipliers as Record<number, number>)
        }
      }
      setAdjustedTotals(restored)
    }

    const { data: qa } = await supabase.from('quick_adds').select('*').eq('date', today)
    const { unique, duplicateIds } = dedupeQuickAdds((qa || []) as StoredQuickItem[])
    setQuickAdds(unique)
    if (duplicateIds.length > 0) {
      await supabase.from('quick_adds').delete().in('id', duplicateIds)
    }
    setLoading(false)
  }, [today])

  useEffect(() => { fetchLog() }, [fetchLog])

  async function createLog(dayType: DayType, gymDay: boolean) {
    setSaving(true)
    const totals = calculateDayTotals(dayType, gymDay)
    const { data } = await supabase.from('daily_logs').upsert({
      date: today, day_type: dayType, gym_day: gymDay,
      breakfast_confirmed: dayType !== 'sunday_fast', // Sunday fast = manual confirm
      lunch_confirmed: false, dinner_confirmed: false,
      shake_confirmed: false, vita_coco_confirmed: false, snack_confirmed: false,
      cal_total: totals.cal, protein_total: totals.protein,
      sodium_total: totals.sodium, fiber_total: totals.fiber, carbs_total: totals.carbs,
      meal_customizations: {},
    }, { onConflict: 'date' }).select().single()
    setLog(data); setShowDaySelector(false); setSaving(false)
  }

  async function updateLog(updates: Partial<DailyLog>) {
    if (!log) return
    const { data } = await supabase.from('daily_logs').update(updates).eq('id', log.id).select().single()
    setLog(data)
  }

  async function syncConsumed(updatedLog: DailyLog, updatedAdjusted: Partial<Record<MealKey, Macro>>, updatedQuickAdds: QuickItem[]) {
    if (!meals) return
    const c = { cal: 0, protein: 0, sodium: 0, fiber: 0, carbs: 0 }
    const add = (m: Macro) => { c.cal += m.cal; c.protein += m.protein; c.sodium += m.sodium; c.fiber += m.fiber; c.carbs += m.carbs }
    const eff = (key: MealKey, def: Macro) => updatedAdjusted[key] || def

    if (updatedLog.breakfast_confirmed) {
      if (updatedLog.breakfast_override) {
        c.cal += updatedLog.breakfast_override_cal || 0
        c.protein += updatedLog.breakfast_override_protein || 0
        c.sodium += updatedLog.breakfast_override_sodium || 0
      } else add(eff('breakfast', meals.breakfast.totals))
    }
    if (updatedLog.lunch_confirmed && meals.lunch) add(eff('lunch', meals.lunch.totals))
    if ((updatedLog as any).shake_confirmed && meals.shake) add(eff('shake', meals.shake.totals))
    if ((updatedLog as any).vita_coco_confirmed && meals.vitaCoco) add(eff('vita_coco', meals.vitaCoco.totals))
    if (updatedLog.dinner_confirmed && meals.dinner) add(eff('dinner', meals.dinner.totals))
    if ((updatedLog as any).snack_confirmed && meals.snack) add(eff('snack', meals.snack.totals))
    updatedQuickAdds.forEach(qa => { c.cal += qa.cal; c.protein += qa.protein; c.sodium += qa.sodium; c.fiber += qa.fiber; c.carbs += qa.carbs })

    await supabase.from('daily_logs').update({
      cal_consumed: Math.round(c.cal),
      protein_consumed: Math.round(c.protein * 10) / 10,
      sodium_consumed: Math.round(c.sodium),
      fiber_consumed: Math.round(c.fiber * 10) / 10,
      carbs_consumed: Math.round(c.carbs * 10) / 10,
    }).eq('id', updatedLog.id)
  }

  async function confirmMeal(key: MealKey, adjusted?: Macro) {
    const fieldMap: Record<MealKey, string> = {
      breakfast: 'breakfast_confirmed', lunch: 'lunch_confirmed',
      shake: 'shake_confirmed', vita_coco: 'vita_coco_confirmed',
      dinner: 'dinner_confirmed', snack: 'snack_confirmed',
    }
    await supabase.from('daily_logs').update({ [fieldMap[key]]: true } as any).eq('id', log!.id)
    const newAdj = adjusted ? { ...adjustedTotals, [key]: adjusted } : adjustedTotals
    if (adjusted) setAdjustedTotals(newAdj)
    // Refetch fresh data from DB
    const { data } = await supabase.from('daily_logs').select('*').eq('id', log!.id).single()
    setLog(data)
    if (data) await syncConsumed(data, newAdj, quickAdds)
  }

  async function undoMeal(key: MealKey) {
    const fieldMap: Record<MealKey, string> = {
      breakfast: 'breakfast_confirmed', lunch: 'lunch_confirmed',
      shake: 'shake_confirmed', vita_coco: 'vita_coco_confirmed',
      dinner: 'dinner_confirmed', snack: 'snack_confirmed',
    }
    await supabase.from('daily_logs').update({ [fieldMap[key]]: false } as any).eq('id', log!.id)
    const newAdj = { ...adjustedTotals }
    delete newAdj[key]
    setAdjustedTotals(newAdj)
    // Refetch fresh data from DB to guarantee UI is in sync
    const { data } = await supabase.from('daily_logs').select('*').eq('id', log!.id).single()
    setLog(data)
    if (data) await syncConsumed(data, newAdj, quickAdds)
  }

  async function saveMealMultipliers(key: MealKey, multipliers: Record<number, number>, adjusted: Macro) {
    const newCustom = { ...mealMultipliers, [key]: multipliers }
    setMealMultipliers(newCustom)
    setAdjustedTotals(prev => ({ ...prev, [key]: adjusted }))
    await updateLog({ meal_customizations: newCustom } as any)
  }

  async function applySwap(meal: 'lunch'|'dinner', newMealId: string) {
    await updateLog({ [`${meal}_swapped_to`]: newMealId })
    await supabase.from('meal_swaps_log').insert({ date: today, meal_type: meal, original_meal: meal, swapped_to: newMealId })
    setShowSwap(null)
  }

  async function handleQuickAdd(item: QuickItem) {
    const signature = quickAddSignature(item)
    if (quickAddInFlight.current.has(signature)) return

    quickAddInFlight.current.add(signature)
    try {
      const { data } = await supabase.from('quick_adds').insert({ date: today, ...item }).select().single()
      const newQA = [...quickAdds, { ...item, id: data?.id }]
      setQuickAdds(newQA)
      setShowQuickAdd(false)
      if (log) await syncConsumed(log, adjustedTotals, newQA)
    } finally {
      quickAddInFlight.current.delete(signature)
    }
  }

  async function removeQuickAdd(id: string) {
    await supabase.from('quick_adds').delete().eq('id', id)
    const newQA = quickAdds.filter(qa => qa.id !== id)
    setQuickAdds(newQA)
    if (log) await syncConsumed(log, adjustedTotals, newQA)
  }

  const meals = log ? getDayMeals(log.day_type as DayType, log.gym_day) : null
  const dayLabel = log ? DAY_TYPE_OPTIONS.find(d => d.value === log.day_type) : null
  const swapOptions = showSwap === 'dinner' && log
    ? (SWAP_OPTIONS[`${log.day_type}_dinner_${log.gym_day ? 'gym' : 'rest'}`] || SWAP_OPTIONS[`${log.day_type}_dinner`] || [])
    : []

  // Helper: get effective totals for a meal (adjusted or default)
  function getEffective(key: MealKey, defaultMacro: Macro): Macro {
    return adjustedTotals[key] || defaultMacro
  }

  // Build consumed from confirmed meals
  const consumed = { cal: 0, protein: 0, sodium: 0, fiber: 0, carbs: 0 }
  if (log && meals) {
    const add = (m: Macro) => { consumed.cal += m.cal; consumed.protein += m.protein; consumed.sodium += m.sodium; consumed.fiber += m.fiber; consumed.carbs += m.carbs }

    if (log.breakfast_confirmed) {
      if (log.breakfast_override) {
        consumed.cal += log.breakfast_override_cal || 0
        consumed.protein += log.breakfast_override_protein || 0
        consumed.sodium += log.breakfast_override_sodium || 0
      } else add(getEffective('breakfast', meals.breakfast.totals))
    }
    if (log.lunch_confirmed && meals.lunch) add(getEffective('lunch', meals.lunch.totals))
    if ((log as any).shake_confirmed && meals.shake) add(getEffective('shake', meals.shake.totals))
    if ((log as any).vita_coco_confirmed && meals.vitaCoco) add(getEffective('vita_coco', meals.vitaCoco.totals))
    if (log.dinner_confirmed && meals.dinner) add(getEffective('dinner', meals.dinner.totals))
    if ((log as any).snack_confirmed && meals.snack) add(getEffective('snack', meals.snack.totals))
    quickAdds.forEach(qa => { consumed.cal += qa.cal; consumed.protein += qa.protein; consumed.sodium += qa.sodium; consumed.fiber += qa.fiber; consumed.carbs += qa.carbs })
  }

  const ringCompletion: Record<CelebrationMetric, boolean> = {
    cal: consumed.cal >= TARGETS.cal,
    protein: consumed.protein >= TARGETS.protein,
    fiber: consumed.fiber >= TARGETS.fiber,
    carbs: consumed.carbs >= TARGETS.carbs,
  }

  useEffect(() => {
    if (loading) return

    if (!hasTrackedRingState.current) {
      completedRings.current = ringCompletion
      hasTrackedRingState.current = true
      return
    }

    const nextCompleted = (Object.keys(ringCompletion) as CelebrationMetric[]).find(
      (metric) => ringCompletion[metric] && !completedRings.current[metric],
    )
    completedRings.current = ringCompletion
    if (nextCompleted) setCelebration(nextCompleted)
  }, [loading, ringCompletion.cal, ringCompletion.protein, ringCompletion.fiber, ringCompletion.carbs])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
    </div>
  )

  return (
    <main className="max-w-md mx-auto min-h-screen pb-24 t-bg">
      {/* Header with gradient */}
      <div className="app-header px-4 pt-10 pb-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <img src="/icon-192.png" alt="logo" className="w-8 h-8 rounded-xl" />
            <p className="t-muted text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
          <Link href="/history" className="t-muted text-sm hover:t-text transition-colors">History →</Link>
        </div>
        <h1 className="text-2xl font-bold">{getGreeting()}, Bharath 👋</h1>
      </div>

      {log ? (
        <div className="mx-4 mb-4 rounded-2xl p-4 flex items-center justify-between day-banner">
          <div className="flex items-center gap-3">
            <span className="t-accent"><DayTypeIcon dayType={log.day_type} size={22} /></span>
            <div>
              <p className="font-semibold text-sm">{dayLabel?.label}</p>
              <p className="t-muted text-xs flex items-center gap-1">
                {log.gym_day ? <DumbbellIcon size={13} /> : <LeafIcon size={13} />}
                {log.gym_day ? 'Gym day' : 'Rest day'}
              </p>
            </div>
          </div>
          <button onClick={() => setShowDaySelector(true)} className="text-xs btn-confirm rounded-lg px-3 py-1.5">Change</button>
        </div>
      ) : (
        <div className="mx-4 mb-4">
          <button onClick={() => setShowDaySelector(true)} className="w-full font-bold rounded-2xl p-4 text-sm btn-confirm flex items-center justify-center gap-2">
            <CalendarIcon size={17} /> Set Today&apos;s Plan
          </button>
        </div>
      )}

      {log && (
        <div className="mx-4 mb-4 t-card2 border t-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs t-muted uppercase tracking-wider">Today&apos;s Progress</p>
            <button onClick={() => setShowQuickAdd(true)} className="text-xs btn-confirm rounded-lg px-2.5 py-1 flex items-center gap-1.5">
              <PlusIcon size={13} /> Quick Add
            </button>
          </div>
          <div className="grid grid-cols-5 gap-1">
            <ProgressRing label="Cal" value={consumed.cal} target={TARGETS.cal} unit="" color="var(--macro-cal)" />
            <ProgressRing label="Protein" value={consumed.protein} target={TARGETS.protein} unit="g" color="var(--macro-protein)" />
            <ProgressRing label="Sodium" value={consumed.sodium} target={TARGETS.sodium} unit="mg" color="var(--macro-sodium)" invert />
            <ProgressRing label="Fiber" value={consumed.fiber} target={TARGETS.fiber} unit="g" color="var(--macro-fiber)" />
            <ProgressRing label="Carbs" value={consumed.carbs} target={TARGETS.carbs} unit="g" color="var(--macro-carbs)" />
          </div>
          <div className="mt-3 pt-3 border-t t-border grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="t-accent font-bold text-sm">{Math.max(0, Math.round(TARGETS.cal - consumed.cal))}</p>
              <p className="t-muted text-xs">cal left</p>
            </div>
            <div>
              <p className={`font-bold text-sm ${TARGETS.sodium - consumed.sodium < 200 ? 'text-red-500' : 'text-amber-500'}`}>
                {Math.max(0, Math.round(TARGETS.sodium - consumed.sodium))}mg
              </p>
              <p className="t-muted text-xs">Na left</p>
            </div>
            <div>
              <p className={`font-bold text-sm ${consumed.protein >= TARGETS.protein ? 't-accent' : 't-text'}`}>
                {consumed.protein >= TARGETS.protein ? '✓ Done' : `${Math.round(TARGETS.protein - consumed.protein)}g`}
              </p>
              <p className="t-muted text-xs">protein</p>
            </div>
          </div>
          {quickAdds.length > 0 && (
            <div className="mt-3 pt-3 border-t t-border">
              <p className="text-xs t-muted mb-2">Quick adds:</p>
              <div className="flex flex-wrap gap-1">
                {quickAdds.map((qa, i) => (
                  <span key={i} className="macro-pill rounded-lg px-2 py-1 text-xs t-text2 flex items-center gap-1.5">
                    {qa.emoji} {qa.name} +{qa.cal}cal
                    {qa.id && (
                      <button onClick={() => removeQuickAdd(qa.id!)} className="t-muted hover:text-red-400 transition-colors ml-0.5">×</button>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {log?.gym_day && (
        <div className="mx-4 mb-4 rounded-xl p-3" style={{ background: "var(--accent-dim)", border: "1px solid var(--accent-border)" }}>
          <p className="text-xs font-semibold t-accent flex items-center gap-1.5"><DumbbellIcon size={14} /> GYM DAY PROTOCOL</p>
          <p className="text-xs mt-1 t-muted">Salt + water 30 min before → Vita Coco after → Fairlife at home</p>
        </div>
      )}
      {log?.day_type === 'wfh_chipotle' && (
        <div className="mx-4 mb-4 rounded-xl p-3" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
          <p className="text-red-400 text-xs font-semibold">⚠️ CHIPOTLE ORDER RULES</p>
          <p className="text-red-400/60 text-xs mt-1">NO salsa • NO cheese • NO Fairlife today</p>
        </div>
      )}

      {log && meals && (
        <div className="px-4 space-y-3">
          <p className="text-xs t-muted uppercase tracking-wider mt-2">Today&apos;s Meals</p>

          <MealCard meal={meals.breakfast} label="Breakfast" emoji="🥣"
            confirmed={log.breakfast_confirmed}
            onConfirm={(adj) => confirmMeal('breakfast', adj)}
            onUndo={() => undoMeal('breakfast')}
            onOverride={() => setShowBreakfastOverride(true)}
            isOverride={log.breakfast_override}
            savedMultipliers={(mealMultipliers as any).breakfast}
            onMultipliersChange={(m, adj) => saveMealMultipliers('breakfast', m, adj)}
          />

          {meals.lunch && (
            <MealCard meal={meals.lunch} label="Lunch" emoji="🥗"
              confirmed={log.lunch_confirmed}
              onConfirm={(adj) => confirmMeal('lunch', adj)}
              onUndo={() => undoMeal('lunch')}
              savedMultipliers={(mealMultipliers as any).lunch}
              onMultipliersChange={(m, adj) => saveMealMultipliers('lunch', m, adj)}
            />
          )}

          {meals.shake && (
            <MealCard meal={meals.shake} label="Protein Shake" emoji="🥛"
              confirmed={(log as any).shake_confirmed || false}
              onConfirm={(adj) => confirmMeal('shake', adj)}
              onUndo={() => undoMeal('shake')}
              savedMultipliers={(mealMultipliers as any).shake}
              onMultipliersChange={(m, adj) => saveMealMultipliers('shake', m, adj)}
            />
          )}

          {meals.vitaCoco && (
            <MealCard meal={meals.vitaCoco} label="Post-Gym Electrolytes" emoji="🥥"
              confirmed={(log as any).vita_coco_confirmed || false}
              onConfirm={(adj) => confirmMeal('vita_coco', adj)}
              onUndo={() => undoMeal('vita_coco')}
            />
          )}

          <MealCard meal={meals.dinner} label="Dinner" emoji="🍽️"
            confirmed={log.dinner_confirmed}
            onConfirm={(adj) => confirmMeal('dinner', adj)}
            onUndo={() => undoMeal('dinner')}
            onSwap={swapOptions.length > 0 ? () => setShowSwap('dinner') : undefined}
            swappable={swapOptions.length > 0}
            savedMultipliers={(mealMultipliers as any).dinner}
            onMultipliersChange={(m, adj) => saveMealMultipliers('dinner', m, adj)}
          />

          {meals.snack && (
            <MealCard meal={meals.snack} label="Snack" emoji="🍊"
              confirmed={(log as any).snack_confirmed || false}
              onConfirm={(adj) => confirmMeal('snack', adj)}
              onUndo={() => undoMeal('snack')}
              savedMultipliers={(mealMultipliers as any).snack}
              onMultipliersChange={(m, adj) => saveMealMultipliers('snack', m, adj)}
            />
          )}
        </div>
      )}

      {!log && !loading && (
        <div className="mx-4 mt-8 text-center">
          <ClipboardIcon size={48} className="mx-auto mb-4 t-muted" />
          <p className="t-muted text-sm">Set today&apos;s plan to see your meal suggestions</p>
        </div>
      )}

      <BottomNav active="today" />

      {showDaySelector && <DaySelector onSelect={createLog} onClose={() => setShowDaySelector(false)} saving={saving} />}
      {showSwap && <SwapModal mealType={showSwap} options={swapOptions} onSelect={(id) => applySwap(showSwap, id)} onClose={() => setShowSwap(null)} />}
      {celebration && (
        <ThemeCelebration
          metric={celebration}
          themeName={theme.name}
          onDone={() => setCelebration(null)}
        />
      )}
      {showBreakfastOverride && (
        <BreakfastOverride
          onSave={async (c, p, s) => { await updateLog({ breakfast_override: true, breakfast_override_cal: c, breakfast_override_protein: p, breakfast_override_sodium: s }); setShowBreakfastOverride(false) }}
          onClose={() => setShowBreakfastOverride(false)}
        />
      )}
      {showQuickAdd && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowQuickAdd(false)} />
          {/* Sheet */}
          <div className="relative rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col" style={{ background: 'var(--bg)' }}>
            {/* Handle + header */}
            <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
              <div className="w-8 h-1 rounded-full mx-auto" style={{ background: 'var(--border2)', position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 12 }} />
              <p className="font-semibold text-sm t-text">Quick Add</p>
              <button onClick={() => setShowQuickAdd(false)} className="text-xl t-muted leading-none">✕</button>
            </div>
            {/* Scrollable content */}
            <div className="overflow-y-auto px-4 pb-8 flex-1">
              <QuickAdd onAdd={handleQuickAdd} onClose={() => setShowQuickAdd(false)} />
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
