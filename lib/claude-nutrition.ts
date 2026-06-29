import { FoodAnalysis } from './nutrition-monitor'
import { TARGETS } from './meals'

export interface ClaudeNutritionReport {
  title: string
  summary: string
  positives: string[]
  watch: string[]
  next_actions: string[]
  progress?: string[]
  focus_goals?: string[]
}

interface ClaudeTextBlock {
  type: 'text'
  text: string
}

interface ClaudeResponse {
  content?: ClaudeTextBlock[]
}

const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929'

const USER_GOAL_PROFILE = {
  primary_goal: 'Reduce belly and visceral fat while preserving or increasing lean muscle.',
  coaching_lens: [
    'Favor a sustainable calorie deficit, not crash dieting.',
    'Protect muscle with high protein, consistent strength training support, and enough gym-day carbs.',
    'Treat sodium spikes as water-retention risk and scale-noise, not fat gain.',
    'Prioritize fiber, minimally processed foods, and consistent meal quality for satiety and waist reduction.',
  ],
  body_snapshot: {
    date: '2026-06-19',
    weight_kg: 72.95,
    previous_weight_kg: 74.7,
    lost_so_far_kg: 1.75,
    bmi: 23.3,
    muscle_mass_kg: 38.7,
    muscle_percentage: 53,
    fat_mass_kg: 14.5,
    body_fat_percentage: 19.9,
    visceral_fat_index: 7,
    subcutaneous_fat_percentage: 17.8,
    bmr_kcal: 1593,
  },
  interpretation_rules: [
    'Praise days that preserve muscle: protein near or above target, reasonable calories, and gym-day recovery carbs.',
    'Flag days that may hurt muscle retention: low protein, very low calories on training days, or repeated missed meals.',
    'Flag belly-fat goal risks: repeated calorie surplus, low fiber, high-sodium packaged foods, and poor satiety setup.',
    'For weekly progress, focus on trend behavior: consistency, waist/fat-loss support, sodium-water noise, and muscle-preservation habits.',
  ],
}

function compactAnalysis(analysis: FoodAnalysis) {
  return {
    date: analysis.date,
    day: analysis.dayName,
    totals: analysis.totals,
    targets: TARGETS,
    eaten: analysis.eaten.map((entry) => ({
      slot: entry.slot,
      name: entry.name,
      cal: entry.cal,
      protein: entry.protein,
      sodium: entry.sodium,
      fiber: entry.fiber,
      carbs: entry.carbs,
    })),
    rule_based: {
      headline: analysis.headline,
      positives: analysis.positives,
      watch: analysis.watch,
      suggestions: analysis.suggestions,
    },
  }
}

function reportFallback(title: string, summary: string, analysis?: FoodAnalysis): ClaudeNutritionReport {
  return {
    title,
    summary,
    positives: analysis?.positives || [],
    watch: analysis?.watch || [],
    next_actions: analysis?.suggestions || [],
    progress: [],
    focus_goals: [],
  }
}

function extractJson(text: string) {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) throw new Error('Claude did not return JSON')
  return JSON.parse(text.slice(start, end + 1))
}

function normalizeReport(value: Partial<ClaudeNutritionReport>, fallback: ClaudeNutritionReport): ClaudeNutritionReport {
  return {
    title: typeof value.title === 'string' ? value.title.slice(0, 80) : fallback.title,
    summary: typeof value.summary === 'string' ? value.summary.slice(0, 320) : fallback.summary,
    positives: Array.isArray(value.positives) ? value.positives.map(String).slice(0, 4) : fallback.positives,
    watch: Array.isArray(value.watch) ? value.watch.map(String).slice(0, 4) : fallback.watch,
    next_actions: Array.isArray(value.next_actions) ? value.next_actions.map(String).slice(0, 4) : fallback.next_actions,
    progress: Array.isArray(value.progress) ? value.progress.map(String).slice(0, 4) : fallback.progress,
    focus_goals: Array.isArray(value.focus_goals) ? value.focus_goals.map(String).slice(0, 4) : fallback.focus_goals,
  }
}

async function callClaude(prompt: string, maxTokens: number) {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('Missing ANTHROPIC_API_KEY')

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      temperature: 0.2,
      system: [
        'You are a concise nutrition coach for one user.',
        'Use the provided macro math as truth. Do not invent foods.',
        'Be practical, specific, and direct. This is wellness coaching, not medical advice.',
        'Return valid JSON only. No markdown.',
      ].join(' '),
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Claude request failed: ${response.status} ${text.slice(0, 200)}`)
  }

  const data = await response.json() as ClaudeResponse
  const text = data.content?.filter((block) => block.type === 'text').map((block) => block.text).join('\n') || ''
  return extractJson(text) as Partial<ClaudeNutritionReport>
}

export function getClaudeModel() {
  return CLAUDE_MODEL
}

export async function generateDailyClaudeReport(analysis: FoodAnalysis, previousWeekly?: unknown) {
  const fallback = reportFallback('Daily food analysis', analysis.headline, analysis)
  const prompt = [
    'Create a compact daily food analysis from this logged food.',
    'Return JSON with keys: title, summary, positives, watch, next_actions.',
    'Limits: summary <= 45 words; each array <= 3 short strings.',
    'If previous weekly focus goals are present, mention whether today helped or hurt them.',
    JSON.stringify({
      user_goal_profile: USER_GOAL_PROFILE,
      daily_log: compactAnalysis(analysis),
      previous_weekly_report: previousWeekly || null,
    }),
  ].join('\n')

  try {
    return normalizeReport(await callClaude(prompt, 700), fallback)
  } catch (error) {
    console.error(error)
    return fallback
  }
}

export async function generateWeeklyClaudeReport(analyses: FoodAnalysis[], previousWeekly?: unknown) {
  const scoreDays = analyses.map(compactAnalysis)
  const fallback = reportFallback(
    'Weekly nutrition analysis',
    `${analyses.length} days analyzed. Review repeated sodium, protein, and fiber patterns.`,
  )
  const prompt = [
    'Create a progressive weekly nutrition analysis from these 7 compact daily logs.',
    'Compare against the previous weekly report when present.',
    'Return JSON with keys: title, summary, positives, watch, progress, focus_goals, next_actions.',
    'Limits: summary <= 55 words; each array <= 3 short strings.',
    'Focus on repeated food patterns, not generic advice.',
    JSON.stringify({
      user_goal_profile: USER_GOAL_PROFILE,
      targets: TARGETS,
      days: scoreDays,
      previous_weekly_report: previousWeekly || null,
    }),
  ].join('\n')

  try {
    return normalizeReport(await callClaude(prompt, 1000), fallback)
  } catch (error) {
    console.error(error)
    return fallback
  }
}
