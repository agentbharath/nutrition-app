'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { DayType } from '@/lib/supabase'
import { DAY_TYPE_OPTIONS, Meal, SWAP_OPTIONS, calculateDayTotals, getDayMeals } from '@/lib/meals'

type Mode = 'rest' | 'gym'
type MealSlot = 'breakfast' | 'lunch' | 'shake' | 'vitaCoco' | 'dinner' | 'snack'

const MEAL_SLOTS: Array<{ key: MealSlot; label: string }> = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'shake', label: 'Shake' },
  { key: 'vitaCoco', label: 'Vita Coco' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'snack', label: 'Snack' },
]

function macroLine(meal: Meal) {
  return `${Math.round(meal.totals.cal)} cal • ${Math.round(meal.totals.protein * 10) / 10}g P • ${Math.round(meal.totals.sodium)}mg Na • ${Math.round(meal.totals.fiber * 10) / 10}g F • ${Math.round(meal.totals.carbs * 10) / 10}g C`
}

function MealBlock({ meal, label }: { meal: Meal; label?: string }) {
  return (
    <details className="t-card rounded-2xl p-4 group">
      <summary className="list-none cursor-pointer flex items-start justify-between gap-3">
        <div>
          {label && <p className="text-[11px] uppercase tracking-wider t-muted mb-1">{label}</p>}
          <p className="font-semibold text-sm t-text">{meal.name}</p>
          <p className="text-xs t-muted mt-1">{macroLine(meal)}</p>
        </div>
        <span className="text-xs t-muted group-open:rotate-180 transition-transform mt-1">⌄</span>
      </summary>

      <div className="mt-3 space-y-2">
        {meal.items.map((item, index) => (
          <div key={`${item.name}-${index}`} className="rounded-xl p-3 macro-pill">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium t-text">{item.name}</p>
                <p className="text-xs t-muted">{item.brand ? `${item.brand} • ` : ''}{item.amount}</p>
              </div>
              <p className="text-xs font-semibold t-accent shrink-0">{Math.round(item.cal)} cal</p>
            </div>
            <p className="text-[11px] t-muted mt-2">
              {Math.round(item.protein * 10) / 10}g P • {Math.round(item.sodium)}mg Na • {Math.round(item.fiber * 10) / 10}g fiber • {Math.round(item.carbs * 10) / 10}g carbs
            </p>
          </div>
        ))}
        {meal.notes && <p className="text-xs t-muted italic">{meal.notes}</p>}
      </div>
    </details>
  )
}

export default function MealsPage() {
  const [dayType, setDayType] = useState<DayType>('wfh_regular')
  const [mode, setMode] = useState<Mode>('rest')
  const gymDay = mode === 'gym'

  const selectedOption = DAY_TYPE_OPTIONS.find((option) => option.value === dayType) || DAY_TYPE_OPTIONS[0]
  const meals = getDayMeals(dayType, gymDay)
  const totals = calculateDayTotals(dayType, gymDay)
  const visibleMeals = useMemo(() => (
    MEAL_SLOTS
      .map((slot) => ({ ...slot, meal: meals[slot.key] }))
      .filter((slot): slot is { key: MealSlot; label: string; meal: Meal } => Boolean(slot.meal))
  ), [meals])

  const swapMeals = useMemo(() => {
    const unique = new Map<string, Meal>()
    Object.values(SWAP_OPTIONS).flat().forEach((meal) => unique.set(meal.id, meal))
    return Array.from(unique.values())
  }, [])

  return (
    <main className="max-w-md mx-auto min-h-screen pb-24 t-bg">
      <div className="app-header px-4 pt-10 pb-5 flex items-center gap-3">
        <Link href="/settings" className="text-xl btn-secondary w-8 h-8 flex items-center justify-center rounded-full">←</Link>
        <div>
          <h1 className="text-xl font-bold t-text">Meal Library</h1>
          <p className="text-xs t-muted">Browse available templates and ingredients</p>
        </div>
      </div>

      <div className="px-4 space-y-3">
        <section className="t-card rounded-2xl p-4">
          <p className="text-xs t-muted uppercase tracking-wider mb-3">Day template</p>
          <div className="grid grid-cols-2 gap-2">
            {DAY_TYPE_OPTIONS.map((option) => {
              const active = option.value === dayType
              return (
                <button
                  key={option.value}
                  onClick={() => setDayType(option.value)}
                  className={`rounded-xl p-3 text-left transition-all relative ${active ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {active && <span className="absolute top-2 right-2 text-xs font-bold">✓</span>}
                  <p className="text-sm font-semibold">{option.emoji} {option.label}</p>
                  <p className="text-[11px] opacity-80 mt-1">{option.description}</p>
                </button>
              )
            })}
          </div>
        </section>

        <section className="t-card rounded-2xl p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-sm t-text">{selectedOption.emoji} {selectedOption.label}</p>
              <p className="text-xs t-muted">{gymDay ? 'Gym variant' : 'Rest day variant'}</p>
            </div>
            <div className="macro-pill rounded-xl p-1 flex gap-1">
              {(['rest', 'gym'] as Mode[]).map((value) => (
                <button
                  key={value}
                  onClick={() => setMode(value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${mode === value ? 'btn-primary' : 't-muted'}`}
                >
                  {mode === value ? '✓ ' : ''}{value}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-5 gap-1.5 mt-4">
            {[
              ['Cal', Math.round(totals.cal)],
              ['P', `${Math.round(totals.protein)}g`],
              ['Na', `${Math.round(totals.sodium)}mg`],
              ['F', `${Math.round(totals.fiber)}g`],
              ['C', `${Math.round(totals.carbs)}g`],
            ].map(([label, value]) => (
              <div key={label} className="macro-pill rounded-xl p-2 text-center">
                <p className="text-xs font-bold t-text">{value}</p>
                <p className="text-[10px] t-muted">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          {visibleMeals.map(({ key, label, meal }) => (
            <MealBlock key={`${key}-${meal.id}`} meal={meal} label={label} />
          ))}
        </section>

        <section className="space-y-2">
          <div className="px-1">
            <p className="text-xs t-muted uppercase tracking-wider">Swap options</p>
          </div>
          {swapMeals.map((meal) => (
            <MealBlock key={meal.id} meal={meal} />
          ))}
        </section>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bottom-nav flex">
        <Link href="/" className="flex-1 py-4 t-muted flex flex-col items-center gap-1 hover:t-text transition-colors">
          <span className="text-lg">📋</span><span className="text-[11px]">Today</span>
        </Link>
        <Link href="/history" className="flex-1 py-4 t-muted flex flex-col items-center gap-1 hover:t-text transition-colors">
          <span className="text-lg">📅</span><span className="text-[11px]">History</span>
        </Link>
        <Link href="/monitor" className="flex-1 py-4 t-muted flex flex-col items-center gap-1 hover:t-text transition-colors">
          <span className="text-lg">📈</span><span className="text-[11px]">Analysis</span>
        </Link>
        <Link href="/settings" className="flex-1 py-4 t-muted flex flex-col items-center gap-1 hover:t-text transition-colors">
          <span className="text-lg">⚙️</span><span className="text-[11px]">Settings</span>
        </Link>
      </nav>
    </main>
  )
}
