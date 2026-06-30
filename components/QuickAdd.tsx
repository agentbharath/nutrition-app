'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { searchIngredients, searchUSDAIngredients, IngredientNutrition } from '@/lib/ingredient-nutrition'
import { parseNutritionLabel } from '@/lib/nutrition-label'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface QuickItem {
  name: string
  emoji: string
  cal: number
  protein: number
  sodium: number
  carbs: number
  fiber: number
}

const QUICK_PICKS: QuickItem[] = [
  { name: 'Banana', emoji: '🍌', cal: 105, protein: 1.3, sodium: 1, carbs: 27, fiber: 3 },
  { name: 'Orange', emoji: '🍊', cal: 65, protein: 1.2, sodium: 0, carbs: 15, fiber: 3.4 },
  { name: 'Apple', emoji: '🍎', cal: 95, protein: 0.5, sodium: 2, carbs: 25, fiber: 4.4 },
  { name: 'Watermelon 300g', emoji: '🍉', cal: 90, protein: 1, sodium: 3, carbs: 23, fiber: 1 },
  { name: 'Vita Coco 500ml', emoji: '🥥', cal: 90, protein: 0, sodium: 30, carbs: 23, fiber: 0 },
  { name: '10 Almonds', emoji: '🌰', cal: 82, protein: 3, sodium: 0, carbs: 3, fiber: 1.7 },
  { name: '½ cup white rice', emoji: '🍚', cal: 100, protein: 2, sodium: 0, carbs: 22, fiber: 0.3 },
  { name: 'Planters peanuts 1oz', emoji: '🥜', cal: 170, protein: 7, sodium: 0, carbs: 6, fiber: 2 },
  { name: 'Edamame ½ cup', emoji: '🫛', cal: 95, protein: 8.5, sodium: 5, carbs: 7, fiber: 4 },
  { name: 'Corn ½ cup', emoji: '🌽', cal: 66, protein: 2.5, sodium: 15, carbs: 15, fiber: 2 },
  { name: 'Date', emoji: '🟤', cal: 22, protein: 0.2, sodium: 0, carbs: 6, fiber: 0.6 },
]

interface Props {
  onAdd: (item: QuickItem) => void
  onClose: () => void
}

type Screen = 'home' | 'add' | 'manual' | 'scan' | 'recipe'

interface RecipeIngredient {
  ingredient: IngredientNutrition
  grams: string
}

export default function QuickAdd({ onAdd, onClose }: Props) {
  const [screen, setScreen] = useState<Screen>('home')
  const [query, setQuery] = useState('')
  const [selectedItem, setSelectedItem] = useState<QuickItem | null>(null)
  const [qty, setQty] = useState('1')
  const [recentItems, setRecentItems] = useState<QuickItem[]>([])
  const [searchResults, setSearchResults] = useState<QuickItem[]>([])
  const [searching, setSearching] = useState(false)
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Manual entry
  const [mName, setMName] = useState('')
  const [mCal, setMCal] = useState('')
  const [mProtein, setMProtein] = useState('')
  const [mSodium, setMSodium] = useState('')
  const [mCarbs, setMCarbs] = useState('')
  const [mFiber, setMFiber] = useState('')

  // Scan
  const [scanLoading, setScanLoading] = useState(false)
  const [scanError, setScanError] = useState('')
  const [scanName, setScanName] = useState('')
  const [scanCal, setScanCal] = useState('')
  const [scanProtein, setScanProtein] = useState('')
  const [scanSodium, setScanSodium] = useState('')
  const [scanCarbs, setScanCarbs] = useState('')
  const [scanFiber, setScanFiber] = useState('')
  const [scanServings, setScanServings] = useState('1')
  const [scanConfidence, setScanConfidence] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Recipe
  const [recipeName, setRecipeName] = useState('')
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([])
  const [recipeTotal, setRecipeTotal] = useState({ cal: 0, protein: 0, sodium: 0, carbs: 0, fiber: 0 })
  const [recipeServings, setRecipeServings] = useState('2')
  const [recipeEaten, setRecipeEaten] = useState('1')
  const [ingQuery, setIngQuery] = useState('')
  const [ingResults, setIngResults] = useState<IngredientNutrition[]>([])
  const [ingSearching, setIngSearching] = useState(false)
  const ingRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [customIngName, setCustomIngName] = useState('')
  const [customIngCal, setCustomIngCal] = useState('')
  const [customIngProtein, setCustomIngProtein] = useState('')
  const [customIngSodium, setCustomIngSodium] = useState('')
  const [customIngCarbs, setCustomIngCarbs] = useState('')
  const [customIngFiber, setCustomIngFiber] = useState('')

  // Load recent items from quick_adds
  useEffect(() => {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })
    supabase
      .from('quick_adds')
      .select('name, emoji, cal, protein, sodium, carbs, fiber, date')
      .order('date', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (!data) return
        const seen = new Set<string>()
        const unique: QuickItem[] = []
        for (const row of data) {
          const key = row.name?.toLowerCase().slice(0, 20)
          if (!key || seen.has(key)) continue
          seen.add(key)
          if (unique.length >= 6) break
          unique.push({
            name: row.name,
            emoji: row.emoji || '➕',
            cal: Number(row.cal) || 0,
            protein: Number(row.protein) || 0,
            sodium: Number(row.sodium) || 0,
            carbs: Number(row.carbs) || 0,
            fiber: Number(row.fiber) || 0,
          })
        }
        setRecentItems(unique)
      })
  }, [])

  // Search across presets + USDA
  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current)
    if (!query.trim()) { setSearchResults([]); return }
    const localMatches = searchIngredients(query).slice(0, 5).map((ing) => ({
      name: ing.name, emoji: '🔍',
      cal: ing.cal, protein: ing.protein, sodium: ing.sodium, carbs: ing.carbs, fiber: ing.fiber,
    }))
    const picksMatch = QUICK_PICKS.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    setSearchResults([...picksMatch, ...localMatches])
    if (query.trim().length >= 2) {
      setSearching(true)
      searchRef.current = setTimeout(async () => {
        const usda = await searchUSDAIngredients(query)
        const usdaItems: QuickItem[] = usda.slice(0, 8).map((u) => ({
          name: u.name, emoji: '🏷️',
          cal: u.cal, protein: u.protein, sodium: u.sodium, carbs: u.carbs, fiber: u.fiber,
        }))
        setSearchResults((prev) => {
          const names = new Set(prev.map((p) => p.name.toLowerCase().slice(0, 20)))
          return [...prev, ...usdaItems.filter((u) => !names.has(u.name.toLowerCase().slice(0, 20)))]
        })
        setSearching(false)
      }, 400)
    }
    return () => { if (searchRef.current) clearTimeout(searchRef.current) }
  }, [query])

  // Recipe ingredient search
  useEffect(() => {
    if (ingRef.current) clearTimeout(ingRef.current)
    if (!ingQuery.trim()) { setIngResults(searchIngredients('').slice(0, 8)); return }
    setIngResults(searchIngredients(ingQuery).slice(0, 8))
    if (ingQuery.trim().length >= 2) {
      setIngSearching(true)
      ingRef.current = setTimeout(async () => {
        const usda = await searchUSDAIngredients(ingQuery)
        if (usda.length > 0) setIngResults([...searchIngredients(ingQuery).slice(0, 4), ...usda.slice(0, 6)])
        setIngSearching(false)
      }, 400)
    }
    return () => { if (ingRef.current) clearTimeout(ingRef.current) }
  }, [ingQuery])

  // Recipe totals
  useEffect(() => {
    const totals = recipeIngredients.reduce((acc, row) => {
      const g = parseFloat(row.grams) || 0
      const f = g / 100
      return {
        cal: acc.cal + (row.ingredient.cal * f),
        protein: acc.protein + (row.ingredient.protein * f),
        sodium: acc.sodium + (row.ingredient.sodium * f),
        carbs: acc.carbs + (row.ingredient.carbs * f),
        fiber: acc.fiber + (row.ingredient.fiber * f),
      }
    }, { cal: 0, protein: 0, sodium: 0, carbs: 0, fiber: 0 })
    setRecipeTotal(totals)
  }, [recipeIngredients])

  function r(v: number) { return Math.round(v * 10) / 10 }

  function selectAndShowAdd(item: QuickItem) {
    setSelectedItem(item)
    setQty('1')
    setScreen('add')
  }

  function confirmAdd() {
    if (!selectedItem) return
    const n = Math.max(0.25, parseFloat(qty) || 1)
    onAdd({
      ...selectedItem,
      name: n === 1 ? selectedItem.name : `${selectedItem.name} (${n}x)`,
      cal: Math.round(selectedItem.cal * n),
      protein: r(selectedItem.protein * n),
      sodium: Math.round(selectedItem.sodium * n),
      carbs: r(selectedItem.carbs * n),
      fiber: r(selectedItem.fiber * n),
    })
  }

  function saveManual() {
    if (!mName || !mCal) return
    onAdd({
      name: mName.trim(),
      emoji: '➕',
      cal: Math.round(Number(mCal)),
      protein: r(Number(mProtein) || 0),
      sodium: Math.round(Number(mSodium) || 0),
      carbs: r(Number(mCarbs) || 0),
      fiber: r(Number(mFiber) || 0),
    })
  }

  async function handleScan(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setScanLoading(true); setScanError('')
    try {
      const { createWorker } = await import('tesseract.js')
      const worker = await createWorker('eng', 1, { logger: () => {} })
      const imageUrl = URL.createObjectURL(file)
      const result = await worker.recognize(imageUrl)
      await worker.terminate()
      URL.revokeObjectURL(imageUrl)
      const parsed = parseNutritionLabel(result.data.text, result.data.confidence)
      if (parsed) {
        setScanName('Scanned item')
        setScanCal(String(parsed.cal ?? ''))
        setScanProtein(String(parsed.protein ?? ''))
        setScanSodium(String(parsed.sodium ?? ''))
        setScanCarbs(String(parsed.carbs ?? ''))
        setScanFiber(String(parsed.fiber ?? ''))
        setScanConfidence(parsed.confidence ?? 100)
      } else setScanError('Could not read label. Enter values manually below.')
    } catch { setScanError('Scan failed. Enter manually.') }
    setScanLoading(false)
  }

  function saveScan() {
    if (!scanName || !scanCal) return
    const n = Math.max(0.25, parseFloat(scanServings) || 1)
    onAdd({
      name: scanName.trim(),
      emoji: '🏷️',
      cal: Math.round(Number(scanCal) * n),
      protein: r((Number(scanProtein) || 0) * n),
      sodium: Math.round((Number(scanSodium) || 0) * n),
      carbs: r((Number(scanCarbs) || 0) * n),
      fiber: r((Number(scanFiber) || 0) * n),
    })
  }

  function addIngredient(ing: IngredientNutrition) {
    setRecipeIngredients((prev) => [...prev, { ingredient: ing, grams: '100' }])
    setIngQuery('')
  }

  function addCustomIngredient() {
    if (!customIngName || !customIngCal) return
    addIngredient({
      id: `custom-${Date.now()}`, name: customIngName, aliases: [], cuisine: 'Custom',
      cal: Number(customIngCal), protein: Number(customIngProtein) || 0,
      sodium: Number(customIngSodium) || 0, carbs: Number(customIngCarbs) || 0,
      fiber: Number(customIngFiber) || 0,
    })
    setCustomIngName(''); setCustomIngCal(''); setCustomIngProtein('')
    setCustomIngSodium(''); setCustomIngCarbs(''); setCustomIngFiber('')
  }

  function saveRecipe() {
    if (!recipeName || recipeIngredients.length === 0) return
    const serves = Math.max(1, Number(recipeServings) || 1)
    const ate = Math.max(0.25, Number(recipeEaten) || 1)
    const ratio = ate / serves
    onAdd({
      name: recipeName.trim(),
      emoji: '🍲',
      cal: Math.round(recipeTotal.cal * ratio),
      protein: r(recipeTotal.protein * ratio),
      sodium: Math.round(recipeTotal.sodium * ratio),
      carbs: r(recipeTotal.carbs * ratio),
      fiber: r(recipeTotal.fiber * ratio),
    })
  }

  const macroRow = (item: QuickItem) => (
    <div className="flex gap-2 mt-0.5 flex-wrap">
      <span className="text-xs t-muted">{item.cal} cal</span>
      <span className="text-xs" style={{ color: 'var(--blue)' }}>{item.protein}g P</span>
      <span className="text-xs" style={{ color: 'var(--amber)' }}>{item.sodium}mg Na</span>
    </div>
  )

  const inputCls = "w-full t-input rounded-xl px-3 py-2.5 text-sm"
  const labelCls = "text-xs t-muted mb-1 block"
  const backBtn = (to: Screen) => (
    <button onClick={() => setScreen(to)} className="text-sm t-muted mb-4 flex items-center gap-1">
      ← Back
    </button>
  )

  // ── HOME SCREEN ──────────────────────────────────────────────
  if (screen === 'home') return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="relative">
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search food or ingredient..."
          className={inputCls}
        />
        {searching && (
          <div className="absolute right-3 top-2.5">
            <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          </div>
        )}
      </div>

      {/* Search results */}
      {query.trim() ? (
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {searchResults.length === 0 && !searching && (
            <p className="text-xs t-muted text-center py-3">No results — try manual entry below</p>
          )}
          {searchResults.map((item) => (
            <button key={item.name} onClick={() => selectAndShowAdd(item)}
              className="w-full t-card2 border t-border rounded-xl px-3 py-2.5 text-left flex items-center justify-between">
              <div>
                <p className="text-sm font-medium t-text">{item.emoji} {item.name}</p>
                {macroRow(item)}
              </div>
              <span className="text-xs t-accent font-semibold shrink-0 ml-2">Add</span>
            </button>
          ))}
        </div>
      ) : (
        <>
          {/* Recent quick adds */}
          {recentItems.length > 0 && (
            <div>
              <p className="text-[10px] t-muted uppercase tracking-wider mb-2">Recent</p>
              <div className="space-y-1.5">
                {recentItems.map((item) => (
                  <button key={item.name} onClick={() => selectAndShowAdd(item)}
                    className="w-full t-card2 border t-border rounded-xl px-3 py-2.5 text-left flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium t-text">{item.emoji} {item.name}</p>
                      {macroRow(item)}
                    </div>
                    <span className="text-xs t-accent font-semibold shrink-0 ml-2">Add</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick picks */}
          <div>
            <p className="text-[10px] t-muted uppercase tracking-wider mb-2">Quick picks</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_PICKS.map((item) => (
                <button key={item.name} onClick={() => selectAndShowAdd(item)}
                  className="btn-confirm rounded-xl px-3 py-1.5 text-xs font-medium flex items-center gap-1.5">
                  <span>{item.emoji}</span>
                  <span>{item.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* More options */}
          <div className="border-t t-border pt-3 flex gap-2">
            <button onClick={() => setScreen('scan')} className="flex-1 btn-secondary rounded-xl py-2.5 text-xs font-semibold">
              🏷️ Scan label
            </button>
            <button onClick={() => setScreen('recipe')} className="flex-1 btn-secondary rounded-xl py-2.5 text-xs font-semibold">
              🍲 Recipe
            </button>
            <button onClick={() => setScreen('manual')} className="flex-1 btn-secondary rounded-xl py-2.5 text-xs font-semibold">
              ✎ Manual
            </button>
          </div>
        </>
      )}
    </div>
  )

  // ── ADD QUANTITY SCREEN ──────────────────────────────────────
  if (screen === 'add' && selectedItem) {
    const n = Math.max(0.25, parseFloat(qty) || 1)
    const totals = {
      cal: Math.round(selectedItem.cal * n),
      protein: r(selectedItem.protein * n),
      sodium: Math.round(selectedItem.sodium * n),
    }
    return (
      <div className="flex flex-col gap-4">
        {backBtn('home')}
        <div className="t-card2 border t-border rounded-2xl p-4">
          <p className="text-lg">{selectedItem.emoji} <span className="font-semibold t-text">{selectedItem.name}</span></p>
          <p className="text-xs t-muted mt-1">Per serving: {selectedItem.cal} cal · {selectedItem.protein}g P · {selectedItem.sodium}mg Na</p>
        </div>
        <div>
          <label className={labelCls}>How many servings?</label>
          <div className="flex items-center gap-3">
            <button onClick={() => setQty(String(Math.max(0.25, n - 0.25)))}
              className="w-10 h-10 btn-secondary rounded-xl text-lg font-bold flex items-center justify-center">−</button>
            <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} min="0.25" step="0.25"
              className="flex-1 t-input rounded-xl px-3 py-2.5 text-center text-lg font-bold" />
            <button onClick={() => setQty(String(n + 0.25))}
              className="w-10 h-10 btn-secondary rounded-xl text-lg font-bold flex items-center justify-center">+</button>
          </div>
        </div>
        <div className="flex gap-3 text-center">
          <div className="flex-1 t-card2 rounded-xl p-2">
            <p className="text-lg font-bold t-text">{totals.cal}</p>
            <p className="text-xs t-muted">cal</p>
          </div>
          <div className="flex-1 t-card2 rounded-xl p-2">
            <p className="text-lg font-bold" style={{ color: 'var(--blue)' }}>{totals.protein}g</p>
            <p className="text-xs t-muted">protein</p>
          </div>
          <div className="flex-1 t-card2 rounded-xl p-2">
            <p className="text-lg font-bold" style={{ color: 'var(--amber)' }}>{totals.sodium}mg</p>
            <p className="text-xs t-muted">sodium</p>
          </div>
        </div>
        <button onClick={confirmAdd} className="w-full btn-confirm rounded-xl py-3 text-sm font-bold">
          Add to today
        </button>
      </div>
    )
  }

  // ── MANUAL ENTRY SCREEN ───────────────────────────────────────
  if (screen === 'manual') return (
    <div className="flex flex-col gap-3">
      {backBtn('home')}
      <div>
        <label className={labelCls}>Food name *</label>
        <input value={mName} onChange={(e) => setMName(e.target.value)} placeholder="e.g. Corn 45g" className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Calories *</label>
          <input type="number" value={mCal} onChange={(e) => setMCal(e.target.value)} placeholder="0" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Protein (g)</label>
          <input type="number" value={mProtein} onChange={(e) => setMProtein(e.target.value)} placeholder="0" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Sodium (mg)</label>
          <input type="number" value={mSodium} onChange={(e) => setMSodium(e.target.value)} placeholder="0" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Carbs (g)</label>
          <input type="number" value={mCarbs} onChange={(e) => setMCarbs(e.target.value)} placeholder="0" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Fiber (g)</label>
          <input type="number" value={mFiber} onChange={(e) => setMFiber(e.target.value)} placeholder="0" className={inputCls} />
        </div>
      </div>
      <button onClick={saveManual} disabled={!mName || !mCal} className="w-full btn-confirm rounded-xl py-3 text-sm font-bold disabled:opacity-50">
        Add to today
      </button>
    </div>
  )

  // ── SCAN SCREEN ──────────────────────────────────────────────
  if (screen === 'scan') return (
    <div className="flex flex-col gap-3">
      {backBtn('home')}
      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleScan} />
      <button onClick={() => fileRef.current?.click()} disabled={scanLoading}
        className="w-full btn-confirm rounded-xl py-3 text-sm font-bold disabled:opacity-50">
        {scanLoading ? 'Scanning...' : '📷 Take photo of nutrition label'}
      </button>
      {scanError && <p className="text-xs" style={{ color: 'var(--red)' }}>{scanError}</p>}
      {scanConfidence !== null && scanConfidence < 99 && (
        <p className="text-xs t-muted">Confidence {scanConfidence}% — verify values below</p>
      )}
      <div>
        <label className={labelCls}>Item name *</label>
        <input value={scanName} onChange={(e) => setScanName(e.target.value)} placeholder="e.g. Kirkland Salmon" className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={labelCls}>Cal/serving *</label>
          <input type="number" value={scanCal} onChange={(e) => setScanCal(e.target.value)} placeholder="0" className={inputCls} /></div>
        <div><label className={labelCls}>Protein (g)</label>
          <input type="number" value={scanProtein} onChange={(e) => setScanProtein(e.target.value)} placeholder="0" className={inputCls} /></div>
        <div><label className={labelCls}>Sodium (mg)</label>
          <input type="number" value={scanSodium} onChange={(e) => setScanSodium(e.target.value)} placeholder="0" className={inputCls} /></div>
        <div><label className={labelCls}>Carbs (g)</label>
          <input type="number" value={scanCarbs} onChange={(e) => setScanCarbs(e.target.value)} placeholder="0" className={inputCls} /></div>
        <div><label className={labelCls}>Fiber (g)</label>
          <input type="number" value={scanFiber} onChange={(e) => setScanFiber(e.target.value)} placeholder="0" className={inputCls} /></div>
        <div><label className={labelCls}>Servings eaten</label>
          <input type="number" value={scanServings} onChange={(e) => setScanServings(e.target.value)} placeholder="1" className={inputCls} /></div>
      </div>
      <button onClick={saveScan} disabled={!scanName || !scanCal} className="w-full btn-confirm rounded-xl py-3 text-sm font-bold disabled:opacity-50">
        Add to today
      </button>
    </div>
  )

  // ── RECIPE SCREEN ────────────────────────────────────────────
  if (screen === 'recipe') return (
    <div className="flex flex-col gap-3">
      {backBtn('home')}
      <div>
        <label className={labelCls}>Recipe name *</label>
        <input value={recipeName} onChange={(e) => setRecipeName(e.target.value)} placeholder="e.g. Tuna Masala" className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={labelCls}>Recipe makes (servings)</label>
          <input type="number" value={recipeServings} onChange={(e) => setRecipeServings(e.target.value)} placeholder="2" className={inputCls} /></div>
        <div><label className={labelCls}>You ate (servings)</label>
          <input type="number" value={recipeEaten} onChange={(e) => setRecipeEaten(e.target.value)} placeholder="1" className={inputCls} /></div>
      </div>

      <div>
        <label className={labelCls}>Search ingredient</label>
        <input value={ingQuery} onChange={(e) => setIngQuery(e.target.value)} placeholder="e.g. chicken, quinoa..." className={inputCls} />
        {ingSearching && <p className="text-xs t-muted mt-1">Searching USDA...</p>}
        {ingResults.length > 0 && (
          <div className="mt-2 max-h-40 overflow-y-auto space-y-1.5">
            {ingResults.map((ing) => (
              <button key={ing.id} onClick={() => addIngredient(ing)}
                className="w-full t-card2 border t-border rounded-xl px-3 py-2 text-left flex items-center justify-between">
                <span className="text-sm t-text">{ing.name}</span>
                <span className="text-xs t-accent">Add</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Custom ingredient */}
      <details className="t-card2 rounded-xl border t-border">
        <summary className="text-xs t-muted cursor-pointer px-3 py-2">+ Custom ingredient per 100g</summary>
        <div className="px-3 pb-3 grid grid-cols-2 gap-2 mt-2">
          <div className="col-span-2"><input value={customIngName} onChange={(e) => setCustomIngName(e.target.value)} placeholder="Name" className={inputCls} /></div>
          <input type="number" value={customIngCal} onChange={(e) => setCustomIngCal(e.target.value)} placeholder="Cal" className={inputCls} />
          <input type="number" value={customIngProtein} onChange={(e) => setCustomIngProtein(e.target.value)} placeholder="Protein g" className={inputCls} />
          <input type="number" value={customIngSodium} onChange={(e) => setCustomIngSodium(e.target.value)} placeholder="Sodium mg" className={inputCls} />
          <input type="number" value={customIngCarbs} onChange={(e) => setCustomIngCarbs(e.target.value)} placeholder="Carbs g" className={inputCls} />
          <input type="number" value={customIngFiber} onChange={(e) => setCustomIngFiber(e.target.value)} placeholder="Fiber g" className={inputCls} />
          <button onClick={addCustomIngredient} className="col-span-2 btn-confirm rounded-xl py-2 text-xs font-bold">Add ingredient</button>
        </div>
      </details>

      {recipeIngredients.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] t-muted uppercase tracking-wider">Ingredients added</p>
          {recipeIngredients.map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs t-text flex-1 truncate">{row.ingredient.name}</span>
              <input type="number" value={row.grams} onChange={(e) => {
                setRecipeIngredients((prev) => prev.map((r, j) => j === i ? { ...r, grams: e.target.value } : r))
              }} className="w-16 t-input rounded-lg px-2 py-1 text-xs text-center" placeholder="g" />
              <span className="text-xs t-muted">g</span>
              <button onClick={() => setRecipeIngredients((prev) => prev.filter((_, j) => j !== i))}
                className="text-xs t-muted hover:text-red-400 ml-1">✕</button>
            </div>
          ))}
          <div className="flex gap-3 text-center pt-1">
            {[['cal', 'cal'], ['protein', 'P g'], ['sodium', 'Na mg']].map(([k, label]) => (
              <div key={k} className="flex-1 t-card2 rounded-xl p-2">
                <p className="text-sm font-bold t-text">{Math.round((recipeTotal as any)[k])}</p>
                <p className="text-[10px] t-muted">{label} total</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={saveRecipe} disabled={!recipeName || recipeIngredients.length === 0}
        className="w-full btn-confirm rounded-xl py-3 text-sm font-bold disabled:opacity-50">
        Add recipe to today
      </button>
    </div>
  )

  return null
}
