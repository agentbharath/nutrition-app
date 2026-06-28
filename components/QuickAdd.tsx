'use client'
import { useState } from 'react'

interface QuickItem {
  name: string
  emoji: string
  cal: number
  protein: number
  sodium: number
  carbs: number
  fiber: number
}

const QUICK_ITEMS: QuickItem[] = [
  { name: 'Banana', emoji: '🍌', cal: 105, protein: 1.3, sodium: 1, carbs: 27, fiber: 3 },
  { name: 'Orange', emoji: '🍊', cal: 65, protein: 1.2, sodium: 0, carbs: 15, fiber: 3.4 },
  { name: 'Apple', emoji: '🍎', cal: 95, protein: 0.5, sodium: 2, carbs: 25, fiber: 4.4 },
  { name: 'Watermelon 300g', emoji: '🍉', cal: 90, protein: 1, sodium: 3, carbs: 23, fiber: 1 },
  { name: 'Vita Coco 500ml', emoji: '🥥', cal: 90, protein: 0, sodium: 30, carbs: 23, fiber: 0 },
  { name: '10 Almonds', emoji: '🌰', cal: 82, protein: 3, sodium: 0, carbs: 3, fiber: 1.7 },
  { name: '½ cup white rice', emoji: '🍚', cal: 100, protein: 2, sodium: 0, carbs: 22, fiber: 0.3 },
  { name: 'Planters peanuts 1oz', emoji: '🥜', cal: 170, protein: 7, sodium: 0, carbs: 6, fiber: 2 },
]

interface Props {
  onAdd: (item: QuickItem) => void
  onClose: () => void
}

export default function QuickAdd({ onAdd, onClose }: Props) {
  const [custom, setCustom] = useState(false)
  const [name, setName] = useState('')
  const [cal, setCal] = useState('')
  const [protein, setProtein] = useState('')
  const [sodium, setSodium] = useState('')
  const [carbs, setCarbs] = useState('')

  function handleCustomSave() {
    if (!name || !cal) return
    onAdd({
      name,
      emoji: '➕',
      cal: Number(cal),
      protein: Number(protein) || 0,
      sodium: Number(sodium) || 0,
      carbs: Number(carbs) || 0,
      fiber: 0,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#141414] border-t border-[#222] rounded-t-3xl p-6 pb-8 max-h-[80vh] overflow-y-auto">
        <div className="w-10 h-1 bg-[#333] rounded-full mx-auto mb-6" />
        <h2 className="text-lg font-bold mb-1">Quick Add</h2>
        <p className="text-gray-500 text-sm mb-5">Add something extra you had — updates your daily totals</p>

        {!custom ? (
          <>
            <div className="space-y-2 mb-4">
              {QUICK_ITEMS.map((item) => (
                <button
                  key={item.name}
                  onClick={() => onAdd(item)}
                  className="w-full bg-[#1A1A1A] border border-[#222] rounded-xl p-3 text-left hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{item.emoji}</span>
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <div className="flex gap-2 mt-0.5">
                        <span className="text-xs text-gray-500">{item.cal} cal</span>
                        <span className="text-xs text-blue-400">{item.protein}g P</span>
                        <span className="text-xs text-amber-400">{item.sodium}mg Na</span>
                        <span className="text-xs text-pink-400">{item.carbs}g C</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-emerald-500 text-lg">+</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setCustom(true)}
              className="w-full border border-[#333] text-gray-400 rounded-xl py-3 text-sm hover:text-white hover:border-[#555] transition-colors"
            >
              ✎ Add something else manually
            </button>
          </>
        ) : (
          <>
            <div className="space-y-3 mb-4">
              {[
                { label: 'What did you have?', key: 'name', val: name, set: setName, placeholder: 'e.g. Banana', unit: '' },
                { label: 'Calories', key: 'cal', val: cal, set: setCal, placeholder: 'e.g. 105', unit: 'kcal' },
                { label: 'Protein', key: 'protein', val: protein, set: setProtein, placeholder: 'e.g. 1', unit: 'g' },
                { label: 'Sodium', key: 'sodium', val: sodium, set: setSodium, placeholder: 'e.g. 0', unit: 'mg' },
                { label: 'Carbs', key: 'carbs', val: carbs, set: setCarbs, placeholder: 'e.g. 27', unit: 'g' },
              ].map(({ label, key, val, set, placeholder, unit }) => (
                <div key={key}>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">{label}</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type={key === 'name' ? 'text' : 'number'}
                      value={val}
                      onChange={e => set(e.target.value)}
                      placeholder={placeholder}
                      className="flex-1 bg-[#1A1A1A] border border-[#222] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50 text-white placeholder-gray-600"
                    />
                    {unit && <span className="text-gray-500 text-sm w-8">{unit}</span>}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={handleCustomSave}
              disabled={!name || !cal}
              className="w-full bg-emerald-500 disabled:bg-[#222] disabled:text-gray-600 text-black font-bold rounded-xl py-3 text-sm hover:bg-emerald-400 transition-colors mb-2"
            >
              Add to Today
            </button>
            <button onClick={() => setCustom(false)} className="w-full text-gray-500 text-sm py-2 hover:text-white transition-colors">
              ← Back to quick items
            </button>
          </>
        )}
      </div>
    </div>
  )
}
