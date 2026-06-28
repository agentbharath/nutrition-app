'use client'
import { useState, useEffect } from 'react'
import { Meal, Macro } from '@/lib/meals'

interface Props {
  meal: Meal; label: string; emoji: string; confirmed: boolean
  onConfirm: (adj?: Macro) => void; onUndo?: () => void; onSwap?: () => void
  onOverride?: () => void; swappable?: boolean; isOverride?: boolean
  savedMultipliers?: Record<number, number>
  onMultipliersChange?: (m: Record<number, number>, adj: Macro) => void
}

function calcTotals(meal: Meal, mults: Record<number, number>): Macro {
  return meal.items.reduce((acc, item, i) => {
    const m = mults[i] ?? 1
    return { cal: acc.cal + item.cal * m, protein: acc.protein + item.protein * m,
      sodium: acc.sodium + item.sodium * m, fiber: acc.fiber + item.fiber * m, carbs: acc.carbs + item.carbs * m }
  }, { cal: 0, protein: 0, sodium: 0, fiber: 0, carbs: 0 })
}

const STEPS = [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2]

export default function MealCard({ meal, label, emoji, confirmed, onConfirm, onUndo, onSwap, onOverride, swappable, isOverride, savedMultipliers, onMultipliersChange }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [mults, setMults] = useState<Record<number, number>>(savedMultipliers || {})

  useEffect(() => { if (savedMultipliers) setMults(savedMultipliers) }, [savedMultipliers])

  const adjusted = calcTotals(meal, mults)
  const hasCustom = Object.values(mults).some(m => m !== 1)

  function adjustItem(idx: number, dir: 1 | -1) {
    const cur = mults[idx] ?? 1
    const si = STEPS.indexOf(cur)
    const next = STEPS[Math.max(0, Math.min(STEPS.length - 1, si + dir))]
    const newM = { ...mults, [idx]: next }
    setMults(newM)
    onMultipliersChange?.(newM, calcTotals(meal, newM))
  }

  function resetItem(idx: number) {
    const newM = { ...mults, [idx]: 1 }
    setMults(newM)
    onMultipliersChange?.(newM, calcTotals(meal, newM))
  }

  return (
    <div className={`meal-card rounded-2xl overflow-hidden t-card ${confirmed ? 'card-confirmed' : ''}`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-2 mb-3">
          <span className="text-xl mt-0.5">{emoji}</span>
          <div className="flex-1 cursor-pointer" onClick={() => setExpanded(!expanded)}>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs uppercase tracking-wider font-medium t-muted">{label}</p>
              {confirmed && <span className="text-xs font-semibold t-accent">✓ confirmed</span>}
              {isOverride && <span className="text-xs" style={{ color: 'var(--amber)' }}>✎ custom</span>}
              {hasCustom && !confirmed && <span className="text-xs" style={{ color: 'var(--blue)' }}>✎ adjusted</span>}
            </div>
            <p className="font-semibold text-sm mt-0.5 t-text">{meal.name}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {!confirmed && (
              <button onClick={() => setEditing(!editing)}
                className="text-xs px-2 py-1 rounded-lg btn-secondary"
                style={editing ? { color: 'var(--blue)', borderColor: 'rgba(59,130,246,0.4)' } : {}}>
                ✎
              </button>
            )}
            <button onClick={() => setExpanded(!expanded)} className="text-xs px-1 t-muted">{expanded ? '▲' : '▼'}</button>
          </div>
        </div>

        {/* Macro Pills */}
        <div className="flex gap-1.5 flex-wrap mb-3">
          <span className="macro-pill rounded-lg px-2 py-1 text-xs font-semibold">{Math.round(adjusted.cal)} cal</span>
          <span className="rounded-lg px-2 py-1 text-xs font-semibold" style={{ background: 'rgba(59,130,246,0.12)', color: 'var(--blue)' }}>{adjusted.protein.toFixed(1)}g P</span>
          <span className="rounded-lg px-2 py-1 text-xs font-semibold" style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--amber)' }}>{Math.round(adjusted.sodium)}mg Na</span>
          <span className="rounded-lg px-2 py-1 text-xs font-semibold" style={{ background: 'rgba(139,92,246,0.12)', color: 'var(--purple)' }}>{adjusted.fiber.toFixed(1)}g F</span>
          <span className="rounded-lg px-2 py-1 text-xs font-semibold" style={{ background: 'rgba(236,72,153,0.12)', color: 'var(--pink)' }}>{adjusted.carbs.toFixed(1)}g C</span>
        </div>

        {meal.notes && <p className="text-xs italic mb-3 t-muted">{meal.notes}</p>}

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          {!confirmed && (
            <button onClick={() => onConfirm(adjusted)} className="flex-1 btn-confirm rounded-xl py-2 text-xs font-semibold">
              ✓ Mark as eaten
            </button>
          )}
          {confirmed && onUndo && (
            <button onClick={onUndo} className="btn-secondary rounded-xl px-3 py-2 text-xs font-medium">↩ Undo</button>
          )}
          {label === 'Breakfast' && (
            <button onClick={onOverride} className="btn-secondary rounded-xl px-3 py-2 text-xs">✎ Different breakfast</button>
          )}
          {swappable && onSwap && (
            <button onClick={onSwap} className="btn-secondary rounded-xl px-3 py-2 text-xs font-medium">⇄ Swap</button>
          )}
        </div>
      </div>

      {/* Edit quantities */}
      {editing && !confirmed && (
        <div className="edit-panel p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--blue)' }}>Adjust Quantities</p>
            {hasCustom && (
              <button onClick={() => { setMults({}); onMultipliersChange?.({}, meal.totals) }}
                className="text-xs t-muted hover:t-text transition-colors">Reset all</button>
            )}
          </div>
          <div className="space-y-3">
            {meal.items.map((item, i) => {
              const m = mults[i] ?? 1
              return (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex-1">
                    <p className="text-xs font-medium t-text">{item.name}</p>
                    <p className="text-xs t-muted">{item.amount} • {item.cal} cal</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => adjustItem(i, -1)} disabled={m <= 0}
                      className="w-7 h-7 rounded-lg text-sm font-bold disabled:opacity-30 btn-secondary flex items-center justify-center">−</button>
                    <button onClick={() => resetItem(i)}
                      className="min-w-[36px] text-center text-xs px-1 py-1 rounded-lg transition-colors"
                      style={m !== 1 ? { color: 'var(--blue)', background: 'rgba(59,130,246,0.1)' } : { color: 'var(--muted)' }}>
                      {m === 0 ? 'skip' : m === 1 ? '1×' : `${m}×`}
                    </button>
                    <button onClick={() => adjustItem(i, 1)} disabled={m >= 2}
                      className="w-7 h-7 rounded-lg text-sm font-bold disabled:opacity-30 btn-secondary flex items-center justify-center">+</button>
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-xs t-muted mt-3">Tap multiplier to reset to 1×. 0 = skipped.</p>
        </div>
      )}

      {/* Expanded ingredients */}
      {expanded && !editing && (
        <div className="edit-panel p-4 space-y-2">
          <p className="text-xs uppercase tracking-wider t-muted mb-2">Ingredients</p>
          {meal.items.map((item, i) => {
            const m = mults[i] ?? 1
            return (
              <div key={i} className={`flex items-center justify-between ${m === 0 ? 'opacity-40' : ''}`}>
                <div>
                  <span className="text-xs font-medium t-text">{item.name}</span>
                  {item.brand && <span className="text-xs t-muted ml-1">({item.brand})</span>}
                  <span className="text-xs t-muted ml-1">— {item.amount}</span>
                  {m !== 1 && <span className="text-xs ml-1" style={{ color: 'var(--blue)' }}>{m === 0 ? '(skipped)' : `×${m}`}</span>}
                </div>
                <span className="text-xs t-muted ml-2 shrink-0">{Math.round(item.cal * m)} cal</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
