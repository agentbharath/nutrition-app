export interface ParsedNutritionLabel {
  cal?: number
  protein?: number
  sodium?: number
  carbs?: number
  fiber?: number
}

function cleanText(text: string) {
  return text
    .replace(/[|]/g, ' ')
    .replace(/[‐‑‒–—]/g, '-')
    .replace(/\r/g, '\n')
}

function cleanNumber(value: string) {
  const normalized = value.replace(/[Oo]/g, '0').replace(/,/g, '')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : undefined
}

function firstReasonable(values: Array<number | undefined>, max: number) {
  return values.find((value) => value !== undefined && value >= 0 && value <= max)
}

function findCalories(text: string) {
  const normalized = cleanText(text)
  const values: Array<number | undefined> = []

  for (const line of normalized.split('\n')) {
    if (!/calories/i.test(line) || /from\s+fat/i.test(line)) continue
    values.push(cleanNumber(line.match(/calories\D{0,18}(\d[\dOo,]{0,4})/i)?.[1] || ''))
  }

  values.push(cleanNumber(normalized.match(/calories\D{0,18}(\d[\dOo,]{0,4})/i)?.[1] || ''))
  return firstReasonable(values, 2000)
}

function findMacro(text: string, label: RegExp, unit: 'g' | 'mg', max: number) {
  const normalized = cleanText(text)
  const values: Array<number | undefined> = []
  const unitPattern = unit === 'mg' ? 'm\\s*g|mg' : 'g'
  const labelPattern = `(?:${label.source})`

  for (const line of normalized.split('\n')) {
    if (!label.test(line)) continue
    label.lastIndex = 0
    const withUnit = line.match(new RegExp(`(\\d[\\dOo,.]{0,5})\\s*(?:${unitPattern})`, 'i'))
    const afterLabel = line.match(new RegExp(`${labelPattern}\\D{0,24}(\\d[\\dOo,.]{0,5})`, 'i'))
    values.push(cleanNumber(withUnit?.[1] || ''))
    values.push(cleanNumber(afterLabel?.[1] || ''))
  }

  const fullMatch = normalized.match(new RegExp(`${labelPattern}\\D{0,28}(\\d[\\dOo,.]{0,5})\\s*(?:${unitPattern})?`, 'i'))
  values.push(cleanNumber(fullMatch?.[1] || ''))
  return firstReasonable(values, max)
}

export function parseNutritionLabel(text: string): ParsedNutritionLabel {
  return {
    cal: findCalories(text),
    protein: findMacro(text, /protein/i, 'g', 300),
    sodium: findMacro(text, /sodium/i, 'mg', 10000),
    carbs: findMacro(text, /(?:total\s+)?carbohydrate|carbs/i, 'g', 500),
    fiber: findMacro(text, /(?:dietary\s+)?fiber/i, 'g', 200),
  }
}
