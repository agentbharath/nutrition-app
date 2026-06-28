'use client'
import { useState } from 'react'
import { Meal } from '@/lib/meals'

interface Props {
  meal: Meal
  label: string
  emoji: string
  confirmed: boolean
  onConfirm: () => void
  onSwap?: () => void
  onOverride?: () => void
  swappable?: boolean
  isOverride?: boolean
}

export default function MealCard({ meal, label, emoji, confirmed, onConfirm, onSwap, onOverride, swappable, isOverride }: Props) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={`bg-[#141414] border rounded-2xl overflow-hidden transition-all ${confirmed ? 'border-emerald-500/40' : 'border-[#222]'}`}>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1" onClick={() => setExpanded(!expanded)}>
            <span className="text-xl">{emoji}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
                {confirmed && <span className="text-xs text-emerald-500">✓ confirmed</span>}
                {isOverride && <span className="text-xs text-amber-500">✎ custom</span>}
              </div>
              <p className="font-semibold text-sm mt-0.5">{meal.name}</p>
            </div>
            <span className="text-gray-600 text-xs">{expanded ? '▲' : '▼'}</span>
          </div>
        </div>

        {/* Macro Pills */}
        <div className="flex gap-2 mt-3 flex-wrap">
          <span className="bg-[#222] rounded-lg px-2 py-1 text-xs text-white font-medium">{meal.totals.cal} cal</span>
          <span className="bg-blue-500/10 text-blue-400 rounded-lg px-2 py-1 text-xs font-medium">{meal.totals.protein}g P</span>
          <span className="bg-amber-500/10 text-amber-400 rounded-lg px-2 py-1 text-xs font-medium">{meal.totals.sodium}mg Na</span>
          <span className="bg-purple-500/10 text-purple-400 rounded-lg px-2 py-1 text-xs font-medium">{meal.totals.fiber}g F</span>
          <span className="bg-pink-500/10 text-pink-400 rounded-lg px-2 py-1 text-xs font-medium">{meal.totals.carbs}g C</span>
        </div>

        {/* Notes */}
        {meal.notes && (
          <p className="text-xs text-gray-600 mt-2 italic">{meal.notes}</p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 mt-3">
          {!confirmed && label !== 'Breakfast' && label !== 'Snack' && (
            <button onClick={onConfirm} className="flex-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl py-2 text-xs font-semibold hover:bg-emerald-500/20 transition-colors">
              ✓ Mark as eaten
            </button>
          )}
          {label === 'Breakfast' && (
            <button onClick={onOverride} className="text-xs text-gray-500 border border-[#333] rounded-xl px-3 py-2 hover:text-white hover:border-[#555] transition-colors">
              ✎ Had different breakfast
            </button>
          )}
          {swappable && onSwap && (
            <button onClick={onSwap} className="bg-[#222] text-gray-400 border border-[#333] rounded-xl px-3 py-2 text-xs font-medium hover:text-white hover:border-[#555] transition-colors">
              ⇄ Swap
            </button>
          )}
        </div>
      </div>

      {/* Expanded Items */}
      {expanded && (
        <div className="border-t border-[#222] p-4 space-y-2">
          <p className="text-xs text-gray-600 uppercase tracking-wider mb-2">Ingredients</p>
          {meal.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <div>
                <span className="text-xs text-white">{item.name}</span>
                {item.brand && <span className="text-xs text-gray-600 ml-1">({item.brand})</span>}
                <span className="text-xs text-gray-600 ml-1">— {item.amount}</span>
              </div>
              <span className="text-xs text-gray-500 ml-2 shrink-0">{item.cal} cal</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
