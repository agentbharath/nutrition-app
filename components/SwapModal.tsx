'use client'
import { Meal } from '@/lib/meals'

interface Props {
  mealType: 'lunch' | 'dinner'
  options: Meal[]
  onSelect: (id: string) => void
  onClose: () => void
}

export default function SwapModal({ mealType, options, onSelect, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#141414] border-t border-[#222] rounded-t-3xl p-6 pb-8">
        <div className="w-10 h-1 bg-[#333] rounded-full mx-auto mb-6" />
        <h2 className="text-lg font-bold mb-1">Swap {mealType}</h2>
        <p className="text-gray-500 text-sm mb-5">Choose an alternative meal</p>

        {options.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No swap options available for this meal</p>
        ) : (
          <div className="space-y-2">
            {options.map((meal) => (
              <button
                key={meal.id}
                onClick={() => onSelect(meal.id)}
                className="w-full bg-[#1A1A1A] border border-[#222] rounded-xl p-4 text-left hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all"
              >
                <p className="font-semibold text-sm">{meal.name}</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <span className="text-xs text-gray-400">{meal.totals.cal} cal</span>
                  <span className="text-xs text-blue-400">{meal.totals.protein}g protein</span>
                  <span className="text-xs text-amber-400">{meal.totals.sodium}mg sodium</span>
                </div>
                {meal.notes && <p className="text-xs text-gray-600 mt-1 italic">{meal.notes}</p>}
              </button>
            ))}
          </div>
        )}

        <button onClick={onClose} className="w-full mt-4 border border-[#222] text-gray-400 rounded-xl py-3 text-sm hover:text-white hover:border-[#333] transition-colors">
          Cancel
        </button>
      </div>
    </div>
  )
}
