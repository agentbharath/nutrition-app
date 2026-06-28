export interface ParsedNutritionLabel {
  cal?: number
  protein?: number
  sodium?: number
  carbs?: number
  fiber?: number
  confidence: number
  warnings: string[]
}

interface ExtractedValue {
  value?: number
  direct: boolean
  inferred?: boolean
}

function cleanText(text: string) {
  return text
    .replace(/[|]/g, ' ')
    .replace(/\bO(?=\s*g\b)/gi, '0')
    .replace(/\bO(?=\s*m\s*g\b)/gi, '0')
    .replace(/[‐‑‒–—]/g, '-')
    .replace(/\r/g, '\n')
}

function cleanNumber(value: string) {
  if (!/[0-9OoGg]/.test(value)) return undefined
  const normalized = value
    .replace(/[Oo]/g, '0')
    .replace(/[Gg](?=[0-9Oo]*$)/g, '6')
    .replace(/,/g, '')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : undefined
}

function firstReasonable(values: Array<number | undefined>, max: number) {
  return values.find((value) => value !== undefined && value >= 0 && value <= max)
}

function findCalories(text: string): ExtractedValue {
  const normalized = cleanText(text)
  const values: Array<number | undefined> = []
  const numberPattern = '([0-9OoGg][0-9OoGg,]{0,4})'

  for (const line of normalized.split('\n')) {
    if (!/calories/i.test(line) || /from\s+fat/i.test(line)) continue
    values.push(cleanNumber(line.match(new RegExp(`calories\\D{0,18}${numberPattern}`, 'i'))?.[1] || ''))
  }

  values.push(cleanNumber(normalized.match(new RegExp(`calories\\D{0,18}${numberPattern}`, 'i'))?.[1] || ''))
  const value = firstReasonable(values, 2000)
  return { value, direct: value !== undefined }
}

function findMacro(text: string, label: RegExp, unit: 'g' | 'mg', max: number): ExtractedValue {
  const normalized = cleanText(text)
  const values: Array<number | undefined> = []
  const unitPattern = unit === 'mg' ? 'm\\s*g|mg' : 'g'
  const labelPattern = `(?:${label.source})`
  const numberPattern = '([0-9OoGg][0-9OoGg,.]{0,5})'

  for (const line of normalized.split('\n')) {
    if (!label.test(line)) continue
    label.lastIndex = 0
    const withUnit = line.match(new RegExp(`${numberPattern}\\s*(?:${unitPattern})`, 'i'))
    const afterLabel = line.match(new RegExp(`${labelPattern}\\D{0,24}${numberPattern}`, 'i'))
    values.push(cleanNumber(withUnit?.[1] || ''))
    values.push(cleanNumber(afterLabel?.[1] || ''))
  }

  const fullMatch = normalized.match(new RegExp(`${labelPattern}\\D{0,28}${numberPattern}\\s*(?:${unitPattern})?`, 'i'))
  values.push(cleanNumber(fullMatch?.[1] || ''))
  const value = firstReasonable(values, max)
  return { value, direct: value !== undefined }
}

function confidenceFromEvidence(
  fields: {
    calories: ExtractedValue
    protein: ExtractedValue
    sodium: ExtractedValue
    carbs: ExtractedValue
    fiber: ExtractedValue
    fat: ExtractedValue
  },
  ocrConfidence?: number,
) {
  const warnings: string[] = []
  const required = [fields.calories, fields.protein, fields.sodium, fields.carbs]
  const directRequired = required.filter((field) => field.direct).length
  let confidence = directRequired * 18

  if (fields.fiber.direct || fields.fiber.inferred) confidence += 8
  if (typeof ocrConfidence === 'number') confidence += Math.min(10, Math.max(0, Math.round(ocrConfidence / 10)))

  const canCheckCalories =
    fields.calories.value !== undefined &&
    fields.carbs.value !== undefined &&
    fields.protein.value !== undefined &&
    fields.fat.value !== undefined

  if (canCheckCalories) {
    const macroCalories = fields.carbs.value! * 4 + fields.protein.value! * 4 + fields.fat.value! * 9
    const delta = Math.abs(macroCalories - fields.calories.value!)
    const tolerance = Math.max(5, fields.calories.value! * 0.08)

    if (delta <= tolerance) {
      confidence += 18
    } else {
      confidence -= 18
      warnings.push(`Calories do not match macro math (${Math.round(macroCalories)} expected).`)
    }
  } else {
    warnings.push('Could not cross-check calories because fat, carbs, or protein was missing.')
  }

  if (directRequired < required.length) warnings.push('One or more required fields were not directly found.')

  if (
    fields.calories.direct &&
    fields.protein.direct &&
    fields.sodium.direct &&
    fields.carbs.direct &&
    fields.fat.direct &&
    canCheckCalories &&
    warnings.length === 0
  ) {
    confidence = Math.max(confidence, 99)
  }

  return {
    confidence: Math.max(0, Math.min(99, Math.round(confidence))),
    warnings,
  }
}

export function parseNutritionLabel(text: string, ocrConfidence?: number): ParsedNutritionLabel {
  const calories = findCalories(text)
  const protein = findMacro(text, /protein/i, 'g', 300)
  const sodium = findMacro(text, /sodium/i, 'mg', 10000)
  const carbs = findMacro(text, /(?:total\s+)?(?:carbohydrate|carb\.?|carbs)/i, 'g', 500)
  const fat = findMacro(text, /(?:total\s+)?fat/i, 'g', 300)
  const fiber = findMacro(text, /(?:dietary\s+)?fiber/i, 'g', 200)
  const inferredFiberZero = !fiber.direct && /not\s+a\s+significant\s+source[\s\S]{0,120}(?:dietary\s+)?fiber/i.test(text)
  const fiberValue = inferredFiberZero ? { value: 0, direct: false, inferred: true } : fiber
  const { confidence, warnings } = confidenceFromEvidence(
    { calories, protein, sodium, carbs, fiber: fiberValue, fat },
    ocrConfidence,
  )

  return {
    cal: calories.value,
    protein: protein.value,
    sodium: sodium.value,
    carbs: carbs.value,
    fiber: fiberValue.value,
    confidence,
    warnings,
  }
}
