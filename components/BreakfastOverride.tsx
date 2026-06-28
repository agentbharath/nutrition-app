'use client'
import { useState } from 'react'

interface Props {
  onSave: (cal: number, protein: number, sodium: number) => void
  onClose: () => void
}

export default function BreakfastOverride({ onSave, onClose }: Props) {
  const [cal, setCal] = useState('')
  const [protein, setProtein] = useState('')
  const [sodium, setSodium] = useState('')

  const valid = cal && protein && sodium

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#141414] border-t border-[#222] rounded-t-3xl p-6 pb-8">
        <div className="w-10 h-1 bg-[#333] rounded-full mx-auto mb-6" />
        <h2 className="text-lg font-bold mb-1">Different Breakfast</h2>
        <p className="text-gray-500 text-sm mb-5">Enter the rough macros for what you had</p>

        <div className="space-y-3">
          {[
            { label: 'Calories', value: cal, setter: setCal, placeholder: 'e.g. 400', unit: 'kcal' },
            { label: 'Protein', value: protein, setter: setProtein, placeholder: 'e.g. 30', unit: 'g' },
            { label: 'Sodium', value: sodium, setter: setSodium, placeholder: 'e.g. 200', unit: 'mg' },
          ].map(({ label, value, setter, placeholder, unit }) => (
            <div key={label}>
              <label className="text-xs text-gray-500 uppercase tracking-wider">{label}</label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  value={value}
                  onChange={e => setter(e.target.value)}
                  placeholder={placeholder}
                  className="flex-1 bg-[#1A1A1A] border border-[#222] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 text-white placeholder-gray-600"
                />
                <span className="text-gray-500 text-sm w-8">{unit}</span>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => valid && onSave(Number(cal), Number(protein), Number(sodium))}
          disabled={!valid}
          className="w-full mt-5 bg-emerald-500 disabled:bg-[#222] disabled:text-gray-600 text-black font-bold rounded-xl py-3.5 text-sm hover:bg-emerald-400 transition-colors disabled:cursor-not-allowed"
        >
          Save Custom Breakfast
        </button>
        <button onClick={onClose} className="w-full mt-2 text-gray-500 text-sm py-2 hover:text-white transition-colors">
          Cancel
        </button>
      </div>
    </div>
  )
}
