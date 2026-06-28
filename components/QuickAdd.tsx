'use client'
import { useState } from 'react'
import { IngredientNutrition, searchIngredients } from '@/lib/ingredient-nutrition'
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

interface RecipeIngredient {
  ingredient: IngredientNutrition
  grams: string
}

export default function QuickAdd({ onAdd, onClose }: Props) {
  const [mode, setMode] = useState<'presets' | 'preset' | 'manual' | 'scan' | 'recipe'>('presets')
  const [name, setName] = useState('')
  const [cal, setCal] = useState('')
  const [protein, setProtein] = useState('')
  const [sodium, setSodium] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fiber, setFiber] = useState('')
  const [servings, setServings] = useState('1')
  const [ocrStatus, setOcrStatus] = useState('')
  const [ocrProgress, setOcrProgress] = useState(0)
  const [ocrText, setOcrText] = useState('')
  const [scanConfidence, setScanConfidence] = useState<number | null>(null)
  const [scanWarnings, setScanWarnings] = useState<string[]>([])
  const [valuesVerified, setValuesVerified] = useState(false)
  const [recipeName, setRecipeName] = useState('')
  const [recipeQuery, setRecipeQuery] = useState('')
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([])
  const [recipeServings, setRecipeServings] = useState('2')
  const [recipeServingsEaten, setRecipeServingsEaten] = useState('1')
  const [customIngredientName, setCustomIngredientName] = useState('')
  const [customIngredientCal, setCustomIngredientCal] = useState('')
  const [customIngredientProtein, setCustomIngredientProtein] = useState('')
  const [customIngredientSodium, setCustomIngredientSodium] = useState('')
  const [customIngredientCarbs, setCustomIngredientCarbs] = useState('')
  const [customIngredientFiber, setCustomIngredientFiber] = useState('')
  const [selectedQuickItem, setSelectedQuickItem] = useState<QuickItem | null>(null)
  const [quickServings, setQuickServings] = useState('1')
  const scanNeedsVerification = mode === 'scan' && scanConfidence !== null && scanConfidence < 99 && !valuesVerified
  const servingCount = Math.max(0, Number(servings) || 0)
  const quickServingCount = Math.max(0, Number(quickServings) || 0)
  const recipeServingCount = Math.max(0, Number(recipeServings) || 0)
  const recipeEatenCount = Math.max(0, Number(recipeServingsEaten) || 0)
  const recipeResults = searchIngredients(recipeQuery)

  function rounded(value: number) {
    return Math.round(value * 10) / 10
  }

  function handleCustomSave() {
    if (!name || !cal || servingCount <= 0 || scanNeedsVerification) return
    const suffix = servingCount === 1 ? '' : ` (${servingCount} servings)`
    onAdd({
      name: `${name}${suffix}`,
      emoji: mode === 'scan' ? '🏷️' : '➕',
      cal: Math.round(Number(cal) * servingCount),
      protein: rounded((Number(protein) || 0) * servingCount),
      sodium: Math.round((Number(sodium) || 0) * servingCount),
      carbs: rounded((Number(carbs) || 0) * servingCount),
      fiber: rounded((Number(fiber) || 0) * servingCount),
    })
  }

  function selectQuickItem(item: QuickItem) {
    setSelectedQuickItem(item)
    setQuickServings('1')
    setMode('preset')
  }

  function quickItemTotals(item: QuickItem, count: number) {
    return {
      cal: Math.round(item.cal * count),
      protein: rounded(item.protein * count),
      sodium: Math.round(item.sodium * count),
      carbs: rounded(item.carbs * count),
      fiber: rounded(item.fiber * count),
    }
  }

  function handleQuickItemSave() {
    if (!selectedQuickItem || quickServingCount <= 0) return
    const totals = quickItemTotals(selectedQuickItem, quickServingCount)
    const suffix = quickServingCount === 1 ? '' : ` (${quickServingCount}x)`
    onAdd({
      ...selectedQuickItem,
      name: `${selectedQuickItem.name}${suffix}`,
      ...totals,
    })
  }

  function ingredientTotals(row: RecipeIngredient) {
    const grams = Math.max(0, Number(row.grams) || 0)
    const factor = grams / 100
    return {
      cal: row.ingredient.cal * factor,
      protein: row.ingredient.protein * factor,
      sodium: row.ingredient.sodium * factor,
      carbs: row.ingredient.carbs * factor,
      fiber: row.ingredient.fiber * factor,
    }
  }

  function recipeTotal() {
    return recipeIngredients.reduce(
      (total, row) => {
        const ingredient = ingredientTotals(row)
        return {
          cal: total.cal + ingredient.cal,
          protein: total.protein + ingredient.protein,
          sodium: total.sodium + ingredient.sodium,
          carbs: total.carbs + ingredient.carbs,
          fiber: total.fiber + ingredient.fiber,
        }
      },
      { cal: 0, protein: 0, sodium: 0, carbs: 0, fiber: 0 },
    )
  }

  function recipeConsumedTotal() {
    const total = recipeTotal()
    const multiplier = recipeServingCount > 0 ? recipeEatenCount / recipeServingCount : 0
    return {
      cal: total.cal * multiplier,
      protein: total.protein * multiplier,
      sodium: total.sodium * multiplier,
      carbs: total.carbs * multiplier,
      fiber: total.fiber * multiplier,
    }
  }

  function addRecipeIngredient(ingredient: IngredientNutrition) {
    setRecipeIngredients([...recipeIngredients, { ingredient, grams: '100' }])
    setRecipeQuery('')
  }

  function addCustomRecipeIngredient() {
    if (!customIngredientName || !customIngredientCal) return

    const ingredient: IngredientNutrition = {
      id: `custom-${Date.now()}`,
      name: customIngredientName,
      aliases: [customIngredientName],
      cuisine: 'Custom',
      cal: Number(customIngredientCal) || 0,
      protein: Number(customIngredientProtein) || 0,
      sodium: Number(customIngredientSodium) || 0,
      carbs: Number(customIngredientCarbs) || 0,
      fiber: Number(customIngredientFiber) || 0,
    }

    setRecipeIngredients([...recipeIngredients, { ingredient, grams: '100' }])
    setCustomIngredientName('')
    setCustomIngredientCal('')
    setCustomIngredientProtein('')
    setCustomIngredientSodium('')
    setCustomIngredientCarbs('')
    setCustomIngredientFiber('')
  }

  function updateRecipeIngredient(index: number, grams: string) {
    setRecipeIngredients(recipeIngredients.map((row, i) => i === index ? { ...row, grams } : row))
  }

  function removeRecipeIngredient(index: number) {
    setRecipeIngredients(recipeIngredients.filter((_, i) => i !== index))
  }

  function handleRecipeSave() {
    const consumed = recipeConsumedTotal()
    if (!recipeName || recipeIngredients.length === 0 || recipeServingCount <= 0 || recipeEatenCount <= 0 || consumed.cal <= 0) return

    onAdd({
      name: `${recipeName} (${recipeEatenCount}/${recipeServingCount} recipe)`,
      emoji: '🍲',
      cal: Math.round(consumed.cal),
      protein: rounded(consumed.protein),
      sodium: Math.round(consumed.sodium),
      carbs: rounded(consumed.carbs),
      fiber: rounded(consumed.fiber),
    })
  }

  async function scanNutritionLabel(file: File | null) {
    if (!file) return
    setMode('scan')
    setOcrStatus('Preparing OCR')
    setOcrProgress(0)
    setOcrText('')
    setScanConfidence(null)
    setScanWarnings([])
    setValuesVerified(false)

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
      const parsed = parseNutritionLabel(text, result.data.confidence)
      setOcrText(text.trim())
      setName(name || 'Scanned nutrition label')
      setCal(parsed.cal !== undefined ? String(parsed.cal) : '')
      setProtein(parsed.protein !== undefined ? String(parsed.protein) : '')
      setSodium(parsed.sodium !== undefined ? String(parsed.sodium) : '')
      setCarbs(parsed.carbs !== undefined ? String(parsed.carbs) : '')
      setFiber(parsed.fiber !== undefined ? String(parsed.fiber) : '')
      setScanConfidence(parsed.confidence)
      setScanWarnings(parsed.warnings)
      setOcrStatus(parsed.confidence >= 99 ? '99% confidence verified' : 'Review extracted values')
      setOcrProgress(100)
    } catch (error) {
      console.error(error)
      setOcrStatus('Could not read the label. Try a brighter, closer photo.')
      setOcrProgress(0)
      setScanConfidence(null)
      setScanWarnings([])
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
                  onClick={() => selectQuickItem(item)}
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
                  <span className="t-accent text-xs font-semibold">Choose</span>
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
              onClick={() => setMode('recipe')}
              className="w-full btn-confirm rounded-xl py-3 text-sm font-semibold mb-2"
            >
              🍲 Recipe from ingredients
            </button>
            <button
              onClick={() => setMode('manual')}
              className="w-full border t-border text-gray-400 rounded-xl py-3 text-sm hover:t-text hover:border-[#555] transition-colors"
            >
              ✎ Add something else manually
            </button>
          </>
        ) : mode === 'preset' && selectedQuickItem ? (
          <>
            <div className="rounded-2xl t-card2 p-4 mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedQuickItem.emoji}</span>
                <div>
                  <p className="font-semibold t-text">{selectedQuickItem.name}</p>
                  <p className="text-xs t-muted">Base serving: {selectedQuickItem.cal} cal • {selectedQuickItem.protein}g P • {selectedQuickItem.carbs}g C</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs t-muted uppercase tracking-wider">Amount</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    min="0"
                    step="0.25"
                    value={quickServings}
                    onChange={e => setQuickServings(e.target.value)}
                    className="flex-1 t-card2 border t-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50 t-text"
                  />
                  <span className="t-muted text-sm w-8">x</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5 mt-2">
                  {['0.5', '1', '1.5', '2', '3'].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setQuickServings(value)}
                      className={`rounded-lg py-1.5 text-xs font-semibold ${quickServings === value ? 'btn-confirm' : 'btn-secondary'}`}
                    >
                      {value}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {quickServingCount > 0 && (
              <div className="rounded-xl t-card2 p-3 mb-3">
                <p className="text-xs t-muted uppercase tracking-wider mb-1">Totals added</p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="macro-pill rounded-lg px-2 py-1 text-xs font-medium">{quickItemTotals(selectedQuickItem, quickServingCount).cal} cal</span>
                  <span className="text-xs text-blue-400 rounded-lg px-2 py-1" style={{ background: 'rgba(59,130,246,0.10)' }}>{quickItemTotals(selectedQuickItem, quickServingCount).protein}g P</span>
                  <span className="text-xs text-amber-400 rounded-lg px-2 py-1" style={{ background: 'rgba(245,158,11,0.10)' }}>{quickItemTotals(selectedQuickItem, quickServingCount).sodium}mg Na</span>
                  <span className="text-xs text-pink-400 rounded-lg px-2 py-1" style={{ background: 'rgba(236,72,153,0.10)' }}>{quickItemTotals(selectedQuickItem, quickServingCount).carbs}g C</span>
                  <span className="text-xs text-purple-400 rounded-lg px-2 py-1" style={{ background: 'rgba(139,92,246,0.10)' }}>{quickItemTotals(selectedQuickItem, quickServingCount).fiber}g F</span>
                </div>
              </div>
            )}

            <button
              onClick={handleQuickItemSave}
              disabled={quickServingCount <= 0}
              className="w-full bg-[var(--accent)] disabled:macro-pill disabled:t-muted text-black font-bold rounded-xl py-3 text-sm transition-colors mb-2"
            >
              Add to Today
            </button>
            <button onClick={() => setMode('presets')} className="w-full t-muted text-sm py-2 hover:t-text transition-colors">
              ← Back to quick items
            </button>
          </>
        ) : mode === 'recipe' ? (
          <>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs t-muted uppercase tracking-wider">Recipe name</label>
                <input
                  type="text"
                  value={recipeName}
                  onChange={e => setRecipeName(e.target.value)}
                  placeholder="e.g. Chicken curry"
                  className="mt-1 w-full t-card2 border t-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50 t-text placeholder-gray-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs t-muted uppercase tracking-wider">Recipe makes</label>
                  <input
                    type="number"
                    min="0"
                    step="0.25"
                    value={recipeServings}
                    onChange={e => setRecipeServings(e.target.value)}
                    className="mt-1 w-full t-card2 border t-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50 t-text"
                  />
                  <p className="text-[11px] t-muted mt-1">servings</p>
                </div>
                <div>
                  <label className="text-xs t-muted uppercase tracking-wider">You ate</label>
                  <input
                    type="number"
                    min="0"
                    step="0.25"
                    value={recipeServingsEaten}
                    onChange={e => setRecipeServingsEaten(e.target.value)}
                    className="mt-1 w-full t-card2 border t-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50 t-text"
                  />
                  <p className="text-[11px] t-muted mt-1">servings</p>
                </div>
              </div>

              <div>
                <label className="text-xs t-muted uppercase tracking-wider">Search ingredient</label>
                <input
                  type="text"
                  value={recipeQuery}
                  onChange={e => setRecipeQuery(e.target.value)}
                  placeholder="chicken, onion, rice, tofu..."
                  className="mt-1 w-full t-card2 border t-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50 t-text placeholder-gray-600"
                />
                <div className="mt-2 max-h-44 overflow-y-auto space-y-1.5">
                  {recipeResults.map((ingredient) => (
                    <button
                      key={ingredient.id}
                      onClick={() => addRecipeIngredient(ingredient)}
                      className="w-full t-card2 border t-border rounded-xl px-3 py-2 text-left flex items-center justify-between gap-2"
                    >
                      <span>
                        <span className="text-sm font-medium t-text">{ingredient.name}</span>
                        <span className="block text-xs t-muted">{ingredient.cuisine} • per 100g</span>
                      </span>
                      <span className="text-xs t-accent shrink-0">Add</span>
                    </button>
                  ))}
                </div>
                <details className="mt-2 rounded-xl t-card2 p-3">
                  <summary className="text-xs t-muted cursor-pointer">Add custom ingredient per 100g</summary>
                  <div className="mt-3 space-y-2">
                    <input
                      type="text"
                      value={customIngredientName}
                      onChange={e => setCustomIngredientName(e.target.value)}
                      placeholder="e.g. cassava flour, achiote paste, labneh"
                      className="w-full t-card border t-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500/50 t-text placeholder-gray-600"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Cal', value: customIngredientCal, set: setCustomIngredientCal, unit: 'kcal' },
                        { label: 'Protein', value: customIngredientProtein, set: setCustomIngredientProtein, unit: 'g' },
                        { label: 'Sodium', value: customIngredientSodium, set: setCustomIngredientSodium, unit: 'mg' },
                        { label: 'Carbs', value: customIngredientCarbs, set: setCustomIngredientCarbs, unit: 'g' },
                        { label: 'Fiber', value: customIngredientFiber, set: setCustomIngredientFiber, unit: 'g' },
                      ].map(({ label, value, set, unit }) => (
                        <label key={label} className="text-[11px] t-muted uppercase tracking-wider">
                          {label}
                          <div className="mt-1 flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={value}
                              onChange={e => set(e.target.value)}
                              className="w-full t-card border t-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500/50 t-text"
                            />
                            <span className="normal-case tracking-normal text-xs t-muted w-8">{unit}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={addCustomRecipeIngredient}
                      disabled={!customIngredientName || !customIngredientCal}
                      className="w-full btn-secondary disabled:opacity-50 rounded-lg py-2 text-xs font-semibold"
                    >
                      Add custom ingredient
                    </button>
                  </div>
                </details>
              </div>

              {recipeIngredients.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs t-muted uppercase tracking-wider">Ingredients</p>
                  {recipeIngredients.map((row, index) => {
                    const totals = ingredientTotals(row)
                    return (
                      <div key={`${row.ingredient.id}-${index}`} className="t-card2 rounded-xl p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium t-text">{row.ingredient.name}</p>
                            <p className="text-xs t-muted">{Math.round(totals.cal)} cal • {rounded(totals.protein)}g P • {rounded(totals.carbs)}g C</p>
                          </div>
                          <button onClick={() => removeRecipeIngredient(index)} className="text-xs t-muted hover:text-red-400">Remove</button>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={row.grams}
                            onChange={e => updateRecipeIngredient(index, e.target.value)}
                            className="flex-1 t-card border t-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500/50 t-text"
                          />
                          <span className="text-sm t-muted w-8">g</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {recipeIngredients.length > 0 && recipeServingCount > 0 && recipeEatenCount > 0 && (
              <div className="rounded-xl t-card2 p-3 mb-3">
                <p className="text-xs t-muted uppercase tracking-wider mb-1">Totals added</p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="macro-pill rounded-lg px-2 py-1 text-xs font-medium">{Math.round(recipeConsumedTotal().cal)} cal</span>
                  <span className="text-xs text-blue-400 rounded-lg px-2 py-1" style={{ background: 'rgba(59,130,246,0.10)' }}>{rounded(recipeConsumedTotal().protein)}g P</span>
                  <span className="text-xs text-amber-400 rounded-lg px-2 py-1" style={{ background: 'rgba(245,158,11,0.10)' }}>{Math.round(recipeConsumedTotal().sodium)}mg Na</span>
                  <span className="text-xs text-pink-400 rounded-lg px-2 py-1" style={{ background: 'rgba(236,72,153,0.10)' }}>{rounded(recipeConsumedTotal().carbs)}g C</span>
                  <span className="text-xs text-purple-400 rounded-lg px-2 py-1" style={{ background: 'rgba(139,92,246,0.10)' }}>{rounded(recipeConsumedTotal().fiber)}g F</span>
                </div>
              </div>
            )}

            <button
              onClick={handleRecipeSave}
              disabled={!recipeName || recipeIngredients.length === 0 || recipeServingCount <= 0 || recipeEatenCount <= 0}
              className="w-full bg-[var(--accent)] disabled:macro-pill disabled:t-muted text-black font-bold rounded-xl py-3 text-sm transition-colors mb-2"
            >
              Add Recipe to Today
            </button>
            <button onClick={() => setMode('presets')} className="w-full t-muted text-sm py-2 hover:t-text transition-colors">
              ← Back to quick items
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
                {scanConfidence !== null && (
                  <div
                    className="mt-3 rounded-lg p-2 text-xs"
                    style={{
                      background: scanConfidence >= 99 ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                      border: scanConfidence >= 99 ? '1px solid rgba(16,185,129,0.28)' : '1px solid rgba(245,158,11,0.28)',
                      color: scanConfidence >= 99 ? 'var(--accent-text)' : 'var(--amber)',
                    }}
                  >
                    <p className="font-semibold">{scanConfidence}% extraction confidence</p>
                    {scanWarnings.map((warning) => (
                      <p key={warning} className="mt-1">{warning}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs t-muted uppercase tracking-wider">Servings consumed</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    min="0"
                    step="0.25"
                    value={servings}
                    onChange={e => setServings(e.target.value)}
                    placeholder="1"
                    className="flex-1 t-card2 border t-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50 t-text placeholder-gray-600"
                  />
                  <span className="t-muted text-sm w-8">x</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 mt-2">
                  {['0.5', '1', '1.5', '2'].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setServings(value)}
                      className={`rounded-lg py-1.5 text-xs font-semibold ${servings === value ? 'btn-confirm' : 'btn-secondary'}`}
                    >
                      {value}x
                    </button>
                  ))}
                </div>
              </div>

              {[
                { label: 'What did you have?', key: 'name', val: name, set: setName, placeholder: 'e.g. Banana', unit: '' },
                { label: 'Calories per serving', key: 'cal', val: cal, set: setCal, placeholder: 'e.g. 105', unit: 'kcal' },
                { label: 'Protein per serving', key: 'protein', val: protein, set: setProtein, placeholder: 'e.g. 1', unit: 'g' },
                { label: 'Sodium per serving', key: 'sodium', val: sodium, set: setSodium, placeholder: 'e.g. 0', unit: 'mg' },
                { label: 'Carbs per serving', key: 'carbs', val: carbs, set: setCarbs, placeholder: 'e.g. 27', unit: 'g' },
                { label: 'Fiber per serving', key: 'fiber', val: fiber, set: setFiber, placeholder: 'e.g. 3', unit: 'g' },
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
            {name && cal && servingCount > 0 && (
              <div className="rounded-xl t-card2 p-3 mb-3">
                <p className="text-xs t-muted uppercase tracking-wider mb-1">Totals added</p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="macro-pill rounded-lg px-2 py-1 text-xs font-medium">{Math.round(Number(cal) * servingCount)} cal</span>
                  <span className="text-xs text-blue-400 rounded-lg px-2 py-1" style={{ background: 'rgba(59,130,246,0.10)' }}>{rounded((Number(protein) || 0) * servingCount)}g P</span>
                  <span className="text-xs text-amber-400 rounded-lg px-2 py-1" style={{ background: 'rgba(245,158,11,0.10)' }}>{Math.round((Number(sodium) || 0) * servingCount)}mg Na</span>
                  <span className="text-xs text-pink-400 rounded-lg px-2 py-1" style={{ background: 'rgba(236,72,153,0.10)' }}>{rounded((Number(carbs) || 0) * servingCount)}g C</span>
                  <span className="text-xs text-purple-400 rounded-lg px-2 py-1" style={{ background: 'rgba(139,92,246,0.10)' }}>{rounded((Number(fiber) || 0) * servingCount)}g F</span>
                </div>
              </div>
            )}
            <button
              onClick={handleCustomSave}
              disabled={!name || !cal || servingCount <= 0 || scanNeedsVerification}
              className="w-full bg-[var(--accent)] disabled:macro-pill disabled:t-muted text-black font-bold rounded-xl py-3 text-sm  transition-colors mb-2"
            >
              {scanNeedsVerification ? 'Verify values first' : 'Add to Today'}
            </button>
            {mode === 'scan' && scanConfidence !== null && scanConfidence < 99 && (
              <button
                onClick={() => setValuesVerified(true)}
                className={`w-full rounded-xl py-3 text-sm font-semibold mb-2 ${valuesVerified ? 'btn-confirm' : 'btn-secondary'}`}
              >
                {valuesVerified ? '✓ Values verified by me' : 'I checked the label values'}
              </button>
            )}
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
