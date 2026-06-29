export interface USDAFood {
  id: string
  name: string
  brand?: string
  source: 'usda' | 'local'
  per100g: {
    cal: number
    protein: number
    sodium: number
    carbs: number
    fiber: number
  }
  servingSize?: number    // grams per serving (branded foods)
  servingDesc?: string    // e.g. "1 fillet (170g)"
  dataType?: string       // Foundation | SR Legacy | Branded | Survey
}

// Nutrient IDs in USDA FoodData Central
const NUTRIENT_IDS = {
  energy: [1008, 2047, 2048],        // Energy kcal (multiple possible)
  protein: [1003],
  sodium: [1093],
  carbs: [1005],
  fiber: [1079],
}

function getNutrient(nutrients: Array<{nutrientId: number; value: number}>, ids: number[]): number {
  for (const id of ids) {
    const found = nutrients.find(n => n.nutrientId === id)
    if (found && found.value != null) return found.value
  }
  return 0
}

export async function searchUSDA(query: string, apiKey: string): Promise<USDAFood[]> {
  if (!query.trim() || !apiKey) return []

  const params = new URLSearchParams({
    query: query.trim(),
    api_key: apiKey,
    pageSize: '15',
    // Search all data types — Foundation & SR Legacy for generic foods,
    // Branded for specific products like Kirkland, Morey's, Fairlife
    dataType: 'Foundation,SR Legacy,Branded',
    sortBy: 'dataType.keyword',
    sortOrder: 'asc',  // Foundation first (most accurate), Branded last
  })

  const res = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?${params}`)
  if (!res.ok) throw new Error(`USDA API error: ${res.status}`)

  const data = await res.json()
  const foods = data.foods || []

  return foods
    .map((food: any): USDAFood | null => {
      const nutrients = food.foodNutrients || []
      const cal = getNutrient(nutrients, NUTRIENT_IDS.energy)
      const protein = getNutrient(nutrients, NUTRIENT_IDS.protein)
      const sodium = getNutrient(nutrients, NUTRIENT_IDS.sodium)
      const carbs = getNutrient(nutrients, NUTRIENT_IDS.carbs)
      const fiber = getNutrient(nutrients, NUTRIENT_IDS.fiber)

      // Skip if no meaningful data
      if (cal === 0 && protein === 0) return null

      // For branded foods, USDA returns values per serving not per 100g
      // servingSize is in grams — convert to per 100g
      const servingSize = food.servingSize || 100
      const servingUnit = (food.servingSizeUnit || 'g').toUpperCase()
      const isPer100g = servingUnit === 'G' && servingSize === 100
      const multiplier = isPer100g ? 1 : (100 / (servingUnit === 'G' ? servingSize : 100))

      const brand = food.brandOwner || food.brandName || null
      const name = food.description
        ? food.description.charAt(0).toUpperCase() + food.description.slice(1).toLowerCase()
        : ''

      return {
        id: String(food.fdcId),
        name,
        brand: brand || undefined,
        source: 'usda',
        dataType: food.dataType,
        per100g: {
          cal: Math.round(cal * multiplier),
          protein: Math.round(protein * multiplier * 10) / 10,
          sodium: Math.round(sodium * multiplier),
          carbs: Math.round(carbs * multiplier * 10) / 10,
          fiber: Math.round(fiber * multiplier * 10) / 10,
        },
        servingSize: servingUnit === 'G' ? servingSize : undefined,
        servingDesc: food.householdServingFullText || undefined,
      }
    })
    .filter(Boolean) as USDAFood[]
}

// Priority order for display:
// 1. Foundation (USDA-verified, generic, highest accuracy)
// 2. SR Legacy (older USDA standard reference)
// 3. Branded (specific products — Kirkland, Morey's, Fairlife etc)
export function sortUSDAResults(foods: USDAFood[]): USDAFood[] {
  const priority: Record<string, number> = {
    'Foundation': 0,
    'SR Legacy': 1,
    'Survey (FNDDS)': 2,
    'Branded': 3,
  }
  return foods.sort((a, b) =>
    (priority[a.dataType || ''] ?? 4) - (priority[b.dataType || ''] ?? 4)
  )
}
