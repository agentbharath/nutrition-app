'use client'
import { useState, useEffect } from 'react'
import { Meal, Macro } from '@/lib/meals'

interface Props {
  meal: Meal
  label: string
  emoji: string
  confirmed: boolean
  onConfirm: (adjustedTotals?: Macro) => void
  onUndo?: () => void
  onSwap?: () => void
  onOverride?: () => void
  swappable?: boolean
  isOverride?: boolean
  savedMultipliers?: Record<number, number>
  onMultipliersChange?: (multipliers: Record<number, number>, adjustedTotals: Macro) => void
}

function calcTotals(meal: Meal, multipliers: Record<number, number>): Macro {
  return meal.items.reduce((acc, item, i) => {
    const m = multipliers[i] ?? 1
    return {
      cal: acc.cal + item.cal * m,
      protein: acc.protein + item.protein * m,
      sodium: acc.sodium + item.sodium * m,
      fiber: acc.fiber + item.fiber * m,
      carbs: acc.carbs + item.carbs * m,
    }
  }, { cal: 0, protein: 0, sodium: 0, fiber: 0, carbs: 0 })
}

const STEPS = [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2]

export default function MealCard({
  meal, label, emoji, confirmed,
  onConfirm, onUndo, onSwap, onOverride,
  swappable, isOverride,
  savedMultipliers, onMultipliersChange,
}: Props) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [multipliers, setMultipliers] = useState<Record<number, number>>(savedMultipliers || {})

  useEffect(() => {
    if (savedMultipliers) setMultipliers(savedMultipliers)
  }, [savedMultipliers])

  const adjusted = calcTotals(meal, multipliers)
  const hasCustom = Object.values(multipliers).some(m => m !== 1)

  function adjustItem(idx: number, dir: 1 | -1) {
    const cur = multipliers[idx] ?? 1
    const stepIdx = STEPS.indexOf(cur)
    const next = STEPS[Math.max(0, Math.min(STEPS.length - 1, stepIdx + dir))]
    const newM = { ...multipliers, [idx]: next }
    setMultipliers(newM)
    onMultipliersChange?.(newM, calcTotals(meal, newM))
  }

  function resetItem(idx: number) {
    const newM = { ...multipliers, [idx]: 1 }
    setMultipliers(newM)
    onMultipliersChange?.(newM, calcTotals(meal, newM))
  }

  return (
    <div className={`meal-card bg-[#111111] border rounded-2xl overflow-hidden ${confirmed ? "border-emerald-500/30 confirmed-glow" : "border-[#1E1E1E]"}`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-2 mb-3">
          <span className="text-xl mt-0.5">{emoji}</span>
          <div className="flex-1 cursor-pointer" onClick={() => setExpanded(!expanded)}>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
              {confirmed && <span className="text-xs text-emerald-500 font-medium">✓ confirmed</span>}
              {isOverride && <span className="text-xs text-amber-500">✎ custom</span>}
              {hasCustom && !confirmed && <span className="text-xs text-blue-400">✎ adjusted</span>}
            </div>
            <p className="font-semibold text-sm mt-0.5">{meal.name}</p>
          </div>
          <div className="flex items-center gap-2">
            {!confirmed && (
              <button onClick={() => setEditing(!editing)} className={`text-xs px-2 py-1 rounded-lg border transition-colors ${editing ? 'border-blue-500/50 text-blue-400 bg-blue-500/10' : 'border-[#333] text-gray-500 hover:text-white hover:border-[#555]'}`}>
                ✎
              </button>
            )}
            <button onClick={() => setExpanded(!expanded)} className="text-gray-600 text-xs px-1">{expanded ? '▲' : '▼'}</button>
          </div>
        </div>

        {/* Macro Pills */}
        <div className="flex gap-1.5 flex-wrap mb-3">
          <span className="bg-[#222] rounded-lg px-2 py-1 text-xs text-white font-medium">{Math.round(adjusted.cal)} cal</span>
          <span className="bg-blue-500/10 text-blue-400 rounded-lg px-2 py-1 text-xs font-medium">{adjusted.protein.toFixed(1)}g P</span>
          <span className="bg-amber-500/10 text-amber-400 rounded-lg px-2 py-1 text-xs font-medium">{Math.round(adjusted.sodium)}mg Na</span>
          <span className="bg-purple-500/10 text-purple-400 rounded-lg px-2 py-1 text-xs font-medium">{adjusted.fiber.toFixed(1)}g F</span>
          <span className="bg-pink-500/10 text-pink-400 rounded-lg px-2 py-1 text-xs font-medium">{adjusted.carbs.toFixed(1)}g C</span>
        </div>

        {meal.notes && <p className="text-xs text-gray-600 mb-3 italic">{meal.notes}</p>}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!confirmed && (
            <button
              onClick={() => onConfirm(adjusted)}
              className="flex-1 confirm-btn text-emerald-400 border border-emerald-500/20 rounded-xl py-2 text-xs font-semibold"
            >
              ✓ Mark as eaten
            </button>
          )}
          {confirmed && onUndo && (
            <button
              onClick={onUndo}
              className="text-xs text-gray-500 border border-[#333] rounded-xl px-3 py-2 hover:text-amber-400 hover:border-amber-500/30 transition-colors"
            >
              ↩ Undo
            </button>
          )}
          {label === 'Breakfast' && (
            <button onClick={onOverride} className="text-xs text-gray-500 border border-[#333] rounded-xl px-3 py-2 hover:text-white hover:border-[#555] transition-colors">
              ✎ Different breakfast
            </button>
          )}
          {swappable && onSwap && (
            <button onClick={onSwap} className="bg-[#222] text-gray-400 border border-[#333] rounded-xl px-3 py-2 text-xs font-medium hover:text-white hover:border-[#555] transition-colors">
              ⇄ Swap
            </button>
          )}
        </div>
      </div>

      {/* Edit quantity mode */}
      {editing && !confirmed && (
        <div className="border-t border-[#222] p-4 bg-[#0F0F0F]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-blue-400 font-semibold uppercase tracking-wider">Adjust Quantities</p>
            {hasCustom && (
              <button
                onClick={() => { setMultipliers({}); onMultipliersChange?.({}, meal.totals) }}
                className="text-xs text-gray-500 hover:text-white transition-colors"
              >
                Reset all
              </button>
            )}
          </div>
          <div className="space-y-3">
            {meal.items.map((item, i) => {
              const m = multipliers[i] ?? 1
              return (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex-1">
                    <p className="text-xs text-white">{item.name}</p>
                    <p className="text-xs text-gray-600">{item.amount} • {item.cal} cal</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => adjustItem(i, -1)}
                      disabled={m <= 0}
                      className="w-7 h-7 rounded-lg bg-[#222] text-white text-sm disabled:opacity-30 hover:bg-[#333] transition-colors flex items-center justify-center"
                    >−</button>
                    <button
                      onClick={() => resetItem(i)}
                      className={`min-w-[36px] text-center text-xs px-1 py-1 rounded-lg transition-colors ${m !== 1 ? 'text-blue-400 bg-blue-500/10' : 'text-gray-500'}`}
                    >
                      {m === 0 ? 'skip' : m === 1 ? '1×' : `${m}×`}
                    </button>
                    <button
                      onClick={() => adjustItem(i, 1)}
                      disabled={m >= 2}
                      className="w-7 h-7 rounded-lg bg-[#222] text-white text-sm disabled:opacity-30 hover:bg-[#333] transition-colors flex items-center justify-center"
                    >+</button>
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-gray-600 mt-3">Tap the multiplier to reset to 1×. 0 = skipped item.</p>
        </div>
      )}

      {/* Expanded ingredient list */}
      {expanded && !editing && (
        <div className="border-t border-[#222] p-4 space-y-2">
          <p className="text-xs text-gray-600 uppercase tracking-wider mb-2">Ingredients</p>
          {meal.items.map((item, i) => {
            const m = multipliers[i] ?? 1
            return (
              <div key={i} className={`flex items-center justify-between ${m === 0 ? 'opacity-40' : ''}`}>
                <div>
                  <span className="text-xs text-white">{item.name}</span>
                  {item.brand && <span className="text-xs text-gray-600 ml-1">({item.brand})</span>}
                  <span className="text-xs text-gray-600 ml-1">— {item.amount}</span>
                  {m !== 1 && <span className="text-xs text-blue-400 ml-1">{m === 0 ? '(skipped)' : `×${m}`}</span>}
                </div>
                <span className="text-xs text-gray-500 ml-2 shrink-0">{Math.round(item.cal * m)} cal</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
