'use client'
import { useState } from 'react'
import { DayType } from '@/lib/supabase'
import { DAY_TYPE_OPTIONS } from '@/lib/meals'

interface Props {
  onSelect: (dayType: DayType, gymDay: boolean) => void
  onClose: () => void
  saving: boolean
}

export default function DaySelector({ onSelect, onClose, saving }: Props) {
  const [selected, setSelected] = useState<DayType | null>(null)
  const [gymDay, setGymDay] = useState(false)

  const isSunday = selected === 'sunday_fast'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#141414] border-t border-[#222] rounded-t-3xl p-6 pb-8">
        <div className="w-10 h-1 bg-[#333] rounded-full mx-auto mb-6" />
        <h2 className="text-lg font-bold mb-1">What&apos;s today?</h2>
        <p className="text-gray-500 text-sm mb-5">Pick your day type to get meal suggestions</p>

        <div className="grid grid-cols-2 gap-2 mb-5">
          {DAY_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSelected(opt.value as DayType)}
              className={`p-3 rounded-xl border text-left transition-all ${
                selected === opt.value
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-[#222] hover:border-[#333]'
              }`}
            >
              <span className="text-xl block mb-1">{opt.emoji}</span>
              <p className="text-sm font-semibold leading-tight">{opt.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{opt.description}</p>
            </button>
          ))}
        </div>

        {selected && !isSunday && (
          <div className="mb-5">
            <p className="text-sm font-semibold mb-2">Gym day?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setGymDay(true)}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${gymDay ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-[#222] text-gray-400 hover:border-[#333]'}`}
              >
                🏋️ Yes, gym today
              </button>
              <button
                onClick={() => setGymDay(false)}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${!gymDay ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-[#222] text-gray-400 hover:border-[#333]'}`}
              >
                🛋️ Rest day
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => selected && onSelect(selected, isSunday ? false : gymDay)}
          disabled={!selected || saving}
          className="w-full bg-emerald-500 disabled:bg-[#222] disabled:text-gray-600 text-black font-bold rounded-xl py-3.5 text-sm hover:bg-emerald-400 transition-colors disabled:cursor-not-allowed"
        >
          {saving ? 'Setting up...' : selected ? `Set as ${DAY_TYPE_OPTIONS.find(d => d.value === selected)?.label}` : 'Select a day type'}
        </button>
      </div>
    </div>
  )
}
