'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase, DayType, DailyLog } from '@/lib/supabase'
import { DAY_TYPE_OPTIONS, getDayMeals, calculateDayTotals, TARGETS, DAY_TEMPLATES, SWAP_OPTIONS } from '@/lib/meals'
import ProgressRing from '@/components/ProgressRing'
import MealCard from '@/components/MealCard'
import DaySelector from '@/components/DaySelector'
import SwapModal from '@/components/SwapModal'
import BreakfastOverride from '@/components/BreakfastOverride'
import Link from 'next/link'

function getTodayDate() { return new Date().toISOString().split('T')[0] }
function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Home() {
  const [log, setLog] = useState<DailyLog | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDaySelector, setShowDaySelector] = useState(false)
  const [showSwap, setShowSwap] = useState<'lunch'|'dinner'|null>(null)
  const [showBreakfastOverride, setShowBreakfastOverride] = useState(false)
  const [saving, setSaving] = useState(false)
  const today = getTodayDate()

  const fetchLog = useCallback(async () => {
    const { data } = await supabase.from('daily_logs').select('*').eq('date', today).single()
    setLog(data); setLoading(false)
  }, [today])

  useEffect(() => { fetchLog() }, [fetchLog])

  async function createLog(dayType: DayType, gymDay: boolean) {
    setSaving(true)
    const totals = calculateDayTotals(dayType, gymDay)
    const { data } = await supabase.from('daily_logs').upsert({
      date: today, day_type: dayType, gym_day: gymDay,
      breakfast_confirmed: true, breakfast_override: false,
      lunch_confirmed: false, dinner_confirmed: false,
      cal_total: totals.cal,
      protein_total: totals.protein,
      sodium_total: totals.sodium,
      fiber_total: totals.fiber,
      carbs_total: totals.carbs,
    }, { onConflict: 'date' }).select().single()
    setLog(data); setShowDaySelector(false); setSaving(false)
  }

  async function updateLog(updates: Partial<DailyLog>) {
    if (!log) return
    const { data } = await supabase.from('daily_logs').update(updates).eq('id', log.id).select().single()
    setLog(data)
  }

  async function applySwap(meal: 'lunch'|'dinner', newMealId: string) {
    await updateLog({ [`${meal}_swapped_to`]: newMealId })
    await supabase.from('meal_swaps_log').insert({ date: today, meal_type: meal, original_meal: meal, swapped_to: newMealId })
    setShowSwap(null)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const meals = log ? getDayMeals(log.day_type as DayType, log.gym_day) : null
  const dayLabel = log ? DAY_TYPE_OPTIONS.find(d => d.value === log.day_type) : null
  const swapOptions = showSwap === 'dinner' && log ? (SWAP_OPTIONS[`${log.day_type}_dinner_${log.gym_day ? 'gym' : 'rest'}`] || SWAP_OPTIONS[`${log.day_type}_dinner`] || []) : []

  const consumed = { cal: 0, protein: 0, sodium: 0, fiber: 0, carbs: 0 }
  if (log && meals) {
    if (log.breakfast_confirmed) {
      if (log.breakfast_override) {
        consumed.cal += log.breakfast_override_cal || 0
        consumed.protein += log.breakfast_override_protein || 0
        consumed.sodium += log.breakfast_override_sodium || 0
      } else {
        const b = meals.breakfast.totals
        consumed.cal += b.cal; consumed.protein += b.protein; consumed.sodium += b.sodium; consumed.fiber += b.fiber; consumed.carbs += b.carbs
      }
    }
    if (log.lunch_confirmed && meals.lunch) {
      const l = meals.lunch.totals
      consumed.cal += l.cal; consumed.protein += l.protein; consumed.sodium += l.sodium; consumed.fiber += l.fiber; consumed.carbs += l.carbs
    }
    if (log.dinner_confirmed && meals.dinner) {
      const d = meals.dinner.totals
      consumed.cal += d.cal; consumed.protein += d.protein; consumed.sodium += d.sodium; consumed.fiber += d.fiber; consumed.carbs += d.carbs
    }
  }

  return (
    <main className="max-w-md mx-auto min-h-screen pb-24">
      <div className="px-4 pt-10 pb-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-gray-500 text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          <Link href="/history" className="text-gray-500 text-sm hover:text-white transition-colors">History →</Link>
        </div>
        <h1 className="text-2xl font-bold">{getGreeting()}, Bharath 👋</h1>
      </div>

      {log ? (
        <div className="mx-4 mb-4 bg-[#141414] border border-[#222] rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{dayLabel?.emoji}</span>
            <div>
              <p className="font-semibold text-sm">{dayLabel?.label}</p>
              <p className="text-gray-500 text-xs">{log.gym_day ? '🏋️ Gym day' : '🛋️ Rest day'}</p>
            </div>
          </div>
          <button onClick={() => setShowDaySelector(true)} className="text-xs text-emerald-500 border border-emerald-500/30 rounded-lg px-3 py-1.5 hover:bg-emerald-500/10 transition-colors">Change</button>
        </div>
      ) : (
        <div className="mx-4 mb-4">
          <button onClick={() => setShowDaySelector(true)} className="w-full bg-emerald-500 text-black font-bold rounded-2xl p-4 text-sm hover:bg-emerald-400 transition-colors">📅 Set Today&apos;s Plan</button>
        </div>
      )}

      {log && (
        <div className="mx-4 mb-4 bg-[#141414] border border-[#222] rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">Today&apos;s Progress</p>
          <div className="grid grid-cols-5 gap-1">
            <ProgressRing label="Cal" value={consumed.cal} target={TARGETS.cal} unit="" color="#10B981" />
            <ProgressRing label="Protein" value={consumed.protein} target={TARGETS.protein} unit="g" color="#3B82F6" />
            <ProgressRing label="Sodium" value={consumed.sodium} target={TARGETS.sodium} unit="mg" color="#F59E0B" invert />
            <ProgressRing label="Fiber" value={consumed.fiber} target={TARGETS.fiber} unit="g" color="#8B5CF6" />
            <ProgressRing label="Carbs" value={consumed.carbs} target={TARGETS.carbs} unit="g" color="#EC4899" />
          </div>
          <div className="mt-3 pt-3 border-t border-[#222] grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-emerald-500 font-bold text-sm">{Math.max(0, Math.round(TARGETS.cal - consumed.cal))}</p>
              <p className="text-gray-500 text-xs">cal left</p>
            </div>
            <div>
              <p className={`font-bold text-sm ${TARGETS.sodium - consumed.sodium < 200 ? 'text-red-500' : 'text-amber-500'}`}>
                {Math.max(0, Math.round(TARGETS.sodium - consumed.sodium))}mg
              </p>
              <p className="text-gray-500 text-xs">Na left</p>
            </div>
            <div>
              <p className={`font-bold text-sm ${consumed.protein >= TARGETS.protein ? 'text-emerald-500' : 'text-white'}`}>
                {consumed.protein >= TARGETS.protein ? '✓ Done' : `${Math.round(TARGETS.protein - consumed.protein)}g`}
              </p>
              <p className="text-gray-500 text-xs">protein</p>
            </div>
          </div>
        </div>
      )}

      {log?.gym_day && (
        <div className="mx-4 mb-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3">
          <p className="text-emerald-400 text-xs font-semibold">🏋️ GYM DAY PROTOCOL</p>
          <p className="text-emerald-400/60 text-xs mt-1">Salt + water 30 min before → Vita Coco after → Fairlife at home</p>
        </div>
      )}
      {log?.day_type === 'wfh_chipotle' && (
        <div className="mx-4 mb-4 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
          <p className="text-red-400 text-xs font-semibold">⚠️ CHIPOTLE ORDER RULES</p>
          <p className="text-red-400/60 text-xs mt-1">NO salsa • NO cheese • NO Fairlife today</p>
        </div>
      )}

      {log && meals && (
        <div className="px-4 space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider mt-2">Today&apos;s Meals</p>
          <MealCard meal={meals.breakfast} label="Breakfast" emoji="🥣" confirmed={log.breakfast_confirmed} onConfirm={() => {}} onOverride={() => setShowBreakfastOverride(true)} isOverride={log.breakfast_override} />
          {meals.lunch && <MealCard meal={meals.lunch} label="Lunch" emoji="🥗" confirmed={log.lunch_confirmed} onConfirm={() => updateLog({ lunch_confirmed: true })} />}
          {meals.shake && <MealCard meal={meals.shake} label="Protein Shake" emoji="🥛" confirmed={false} onConfirm={() => {}} />}
          {meals.vitaCoco && <MealCard meal={meals.vitaCoco} label="Post-Gym Electrolytes" emoji="🥥" confirmed={false} onConfirm={() => {}} />}
          <MealCard meal={meals.dinner} label="Dinner" emoji="🍽️" confirmed={log.dinner_confirmed} onConfirm={() => updateLog({ dinner_confirmed: true })} onSwap={swapOptions.length > 0 ? () => setShowSwap('dinner') : undefined} swappable={swapOptions.length > 0} />
          {meals.snack && <MealCard meal={meals.snack} label="Snack" emoji="🍊" confirmed={false} onConfirm={() => {}} />}
        </div>
      )}

      {!log && !loading && (
        <div className="mx-4 mt-8 text-center">
          <p className="text-5xl mb-4">📋</p>
          <p className="text-gray-500 text-sm">Set today&apos;s plan to see your meal suggestions</p>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#0A0A0A] border-t border-[#222] flex">
        <button className="flex-1 py-4 text-emerald-500 flex flex-col items-center gap-1">
          <span className="text-lg">📋</span><span className="text-xs font-medium">Today</span>
        </button>
        <Link href="/history" className="flex-1 py-4 text-gray-500 flex flex-col items-center gap-1 hover:text-white transition-colors">
          <span className="text-lg">📅</span><span className="text-xs">History</span>
        </Link>
        <Link href="/settings" className="flex-1 py-4 text-gray-500 flex flex-col items-center gap-1 hover:text-white transition-colors">
          <span className="text-lg">⚙️</span><span className="text-xs">Settings</span>
        </Link>
      </nav>

      {showDaySelector && <DaySelector onSelect={createLog} onClose={() => setShowDaySelector(false)} saving={saving} />}
      {showSwap && <SwapModal mealType={showSwap} options={swapOptions} onSelect={(id) => applySwap(showSwap, id)} onClose={() => setShowSwap(null)} />}
      {showBreakfastOverride && <BreakfastOverride onSave={async (c,p,s) => { await updateLog({ breakfast_override: true, breakfast_override_cal: c, breakfast_override_protein: p, breakfast_override_sodium: s }); setShowBreakfastOverride(false) }} onClose={() => setShowBreakfastOverride(false)} />}
    </main>
  )
}
