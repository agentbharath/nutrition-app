'use client'
import { useState } from 'react'
import { parseNutritionLabel } from '@/lib/nutrition-label'

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
  const [mode, setMode] = useState<'presets' | 'manual' | 'scan'>('presets')
  const [name, setName] = useState('')
  const [cal, setCal] = useState('')
  const [protein, setProtein] = useState('')
  const [sodium, setSodium] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fiber, setFiber] = useState('')
  const [ocrStatus, setOcrStatus] = useState('')
  const [ocrProgress, setOcrProgress] = useState(0)
  const [ocrText, setOcrText] = useState('')

  function handleCustomSave() {
    if (!name || !cal) return
    onAdd({
      name,
      emoji: mode === 'scan' ? '🏷️' : '➕',
      cal: Number(cal),
      protein: Number(protein) || 0,
      sodium: Number(sodium) || 0,
      carbs: Number(carbs) || 0,
      fiber: Number(fiber) || 0,
    })
  }

  async function scanNutritionLabel(file: File | null) {
    if (!file) return
    setMode('scan')
    setOcrStatus('Preparing OCR')
    setOcrProgress(0)
    setOcrText('')

    try {
      const { createWorker } = await import('tesseract.js')
      const worker = await createWorker('eng', 1, {
        logger: (message) => {
          if (message.status) setOcrStatus(message.status)
          if (typeof message.progress === 'number') setOcrProgress(Math.round(message.progress * 100))
        },
      })

      await worker.setParameters({
        preserve_interword_spaces: '1',
        user_defined_dpi: '300',
      })

      const result = await worker.recognize(file)
      await worker.terminate()

      const text = result.data.text
      const parsed = parseNutritionLabel(text)
      setOcrText(text.trim())
      setName(name || 'Scanned nutrition label')
      setCal(parsed.cal !== undefined ? String(parsed.cal) : '')
      setProtein(parsed.protein !== undefined ? String(parsed.protein) : '')
      setSodium(parsed.sodium !== undefined ? String(parsed.sodium) : '')
      setCarbs(parsed.carbs !== undefined ? String(parsed.carbs) : '')
      setFiber(parsed.fiber !== undefined ? String(parsed.fiber) : '')
      setOcrStatus('Review extracted values')
      setOcrProgress(100)
    } catch (error) {
      console.error(error)
      setOcrStatus('Could not read the label. Try a brighter, closer photo.')
      setOcrProgress(0)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md t-card border-t t-border rounded-t-3xl p-6 pb-8 max-h-[80vh] overflow-y-auto">
        <div className="w-10 h-1 bg-[#333] rounded-full mx-auto mb-6" />
        <h2 className="text-lg font-bold mb-1">Quick Add</h2>
        <p className="t-muted text-sm mb-5">Add something extra you had — updates your daily totals</p>

        {mode === 'presets' ? (
          <>
            <div className="space-y-2 mb-4">
              {QUICK_ITEMS.map((item) => (
                <button
                  key={item.name}
                  onClick={() => onAdd(item)}
                  className="w-full t-card2 border t-border rounded-xl p-3 text-left hover:border-emerald-500/50 hover:bg-[var(--accent)]/5 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{item.emoji}</span>
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <div className="flex gap-2 mt-0.5">
                        <span className="text-xs t-muted">{item.cal} cal</span>
                        <span className="text-xs text-blue-400">{item.protein}g P</span>
                        <span className="text-xs text-amber-400">{item.sodium}mg Na</span>
                        <span className="text-xs text-pink-400">{item.carbs}g C</span>
                      </div>
                    </div>
                  </div>
                  <span className="t-accent text-lg">+</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setMode('scan')}
              className="w-full btn-confirm rounded-xl py-3 text-sm font-semibold mb-2"
            >
              🏷️ Scan nutrition label
            </button>
            <button
              onClick={() => setMode('manual')}
              className="w-full border t-border text-gray-400 rounded-xl py-3 text-sm hover:t-text hover:border-[#555] transition-colors"
            >
              ✎ Add something else manually
            </button>
          </>
        ) : (
          <>
            {mode === 'scan' && (
              <div className="mb-4 rounded-xl t-card2 p-3">
                <label className="block">
                  <span className="text-xs t-muted uppercase tracking-wider">Nutrition label photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(event) => scanNutritionLabel(event.target.files?.[0] || null)}
                    className="mt-2 block w-full text-xs t-muted file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--accent-dim)] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[var(--accent-text)]"
                  />
                </label>
                <p className="text-xs t-muted mt-2">Runs OCR on this device, then uses rules to extract macros. No AI service upload.</p>
                {ocrStatus && (
                  <div className="mt-3">
                    <div className="h-1.5 rounded-full overflow-hidden macro-pill">
                      <div className="h-full bg-[var(--accent)] transition-all" style={{ width: `${ocrProgress}%` }} />
                    </div>
                    <p className="text-xs t-muted mt-1">{ocrStatus}{ocrProgress > 0 && ocrProgress < 100 ? ` ${ocrProgress}%` : ''}</p>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3 mb-4">
              {[
                { label: 'What did you have?', key: 'name', val: name, set: setName, placeholder: 'e.g. Banana', unit: '' },
                { label: 'Calories', key: 'cal', val: cal, set: setCal, placeholder: 'e.g. 105', unit: 'kcal' },
                { label: 'Protein', key: 'protein', val: protein, set: setProtein, placeholder: 'e.g. 1', unit: 'g' },
                { label: 'Sodium', key: 'sodium', val: sodium, set: setSodium, placeholder: 'e.g. 0', unit: 'mg' },
                { label: 'Carbs', key: 'carbs', val: carbs, set: setCarbs, placeholder: 'e.g. 27', unit: 'g' },
                { label: 'Fiber', key: 'fiber', val: fiber, set: setFiber, placeholder: 'e.g. 3', unit: 'g' },
              ].map(({ label, key, val, set, placeholder, unit }) => (
                <div key={key}>
                  <label className="text-xs t-muted uppercase tracking-wider">{label}</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type={key === 'name' ? 'text' : 'number'}
                      value={val}
                      onChange={e => set(e.target.value)}
                      placeholder={placeholder}
                      className="flex-1 t-card2 border t-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50 t-text placeholder-gray-600"
                    />
                    {unit && <span className="t-muted text-sm w-8">{unit}</span>}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={handleCustomSave}
              disabled={!name || !cal}
              className="w-full bg-[var(--accent)] disabled:macro-pill disabled:t-muted text-black font-bold rounded-xl py-3 text-sm  transition-colors mb-2"
            >
              Add to Today
            </button>
            {mode === 'scan' && ocrText && (
              <details className="mb-2 rounded-xl t-card2 p-3">
                <summary className="text-xs t-muted cursor-pointer">Show OCR text</summary>
                <pre className="mt-2 whitespace-pre-wrap text-[11px] t-muted max-h-32 overflow-y-auto">{ocrText}</pre>
              </details>
            )}
            <button onClick={() => setMode('presets')} className="w-full t-muted text-sm py-2 hover:t-text transition-colors">
              ← Back to quick items
            </button>
          </>
        )}
      </div>
    </div>
  )
}
