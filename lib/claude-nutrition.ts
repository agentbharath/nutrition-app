import { FoodAnalysis } from './nutrition-monitor'
import { TARGETS } from './meals'
import { HealthDailyMetrics, compactHealthMetrics } from './health'

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
  primary_goal: 'Reduce belly and visceral fat while preserving all lean muscle on a structured 4.5 month fat-loss protocol.',
  target_outcome: {
    target_weight_kg: 69,
    target_body_fat_percentage: 15,
    emphasis: 'Waist, belly fat, and visceral fat reduction without sacrificing muscle mass or training performance.',
  },
  coaching_lens: [
    'Favor a sustainable calorie deficit, not crash dieting.',
    'Protect muscle with high protein, consistent strength training support, and enough gym-day carbs.',
    'Treat sodium spikes as water-retention risk and scale-noise, not fat gain.',
    'Prioritize fiber, minimally processed foods, and consistent meal quality for satiety and waist reduction.',
    'Judge Sunday fasting as an intentional weekly deficit lever, not as accidental under-eating.',
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
    trend_note: 'Down from 74.70kg and about 21% body fat roughly 3 weeks earlier; protocol is already working.',
  },
  daily_targets: {
    calories_kcal: 1800,
    protein_g_min: 140,
    sodium_mg_max: 1500,
    fiber_g_min: 25,
  },
  fixed_breakfast: {
    name: 'Breakfast bowl',
    foods: ['Fage 0% Greek yogurt', 'chia seeds', 'flaxseeds', 'almonds', 'pumpkin seeds', 'blueberries'],
    macros: { calories_kcal: 497, protein_g: 51 },
    note: 'Every day starts with this bowl unless the log explicitly says otherwise.',
  },
  meal_rotation: [
    'WFH tuna masala template',
    'Avocado toast on Ezekiel zero-sodium bread',
    'Soya stir fry',
    'Chana dal',
    'Strict Chipotle bowl: no salsa, no cheese, ever',
    'Office salad followed by salmon rice bowl at home',
  ],
  gym_day_rules: {
    training_split: 'Push/Pull/Lower/Full Body, 4 days per week',
    walking: '22 minutes each way to the gym',
    lunch_adjustment: 'Add half cup rice to lunch on gym days',
    post_workout: 'Drink Vita Coco 500ml immediately after training for potassium, then Fairlife 42g shake',
    dinner_adjustment: 'Skip peanut butter at dinner to balance added gym-day calories',
  },
  sunday_fast: {
    intent: 'Intentional weekly deficit without starving daily',
    foods: ['Fairlife', 'water', 'green tea', 'fruit only'],
    approximate_calories_kcal: 330,
  },
  supplements: {
    morning: ['D3+K2 with breakfast'],
    night: ['magnesium glycinate', 'ashwagandha'],
    purpose: 'Sleep and recovery support',
  },
  boundaries: {
    sodium: 'No added salt anywhere.',
    processed_food: 'Avoid processed food.',
    restaurants: 'No restaurants except controlled Chipotle.',
  },
  interpretation_rules: [
    'Praise days that preserve muscle: protein near or above target, reasonable calories, and gym-day recovery carbs.',
    'Flag days that may hurt muscle retention: low protein, very low calories on training days, or repeated missed meals.',
    'Flag belly-fat goal risks: repeated calorie surplus, low fiber, high-sodium packaged foods, and poor satiety setup.',
    'For weekly progress, focus on trend behavior: consistency, waist/fat-loss support, sodium-water noise, and muscle-preservation habits.',
    'For daily reports, evaluate that day independently first, then mention whether it helps the weekly protocol.',
    'For weekly reports, give progressive tracking across the seven separated days: which days helped, which days were noisy, and what to adjust next week.',
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
      temperature: 0.4,
      system: [
        'You are a sharp, direct nutrition coach for one specific user whose full context you have.',
        'Use the provided macro math as truth. Do not invent foods.',
        'Write like you actually read the data and formed an opinion — not like you are filling in a template with adjectives next to numbers.',
        'Skip generic praise. If a target was hit, say so in one phrase and spend your words on what is actually interesting, risky, or worth changing.',
        'This is wellness coaching, not medical advice.',
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

export async function generateDailyClaudeReport(analysis: FoodAnalysis, previousWeekly?: unknown, healthMetrics?: HealthDailyMetrics | null) {
  const fallback = reportFallback('Daily food analysis', analysis.headline, analysis)
  const prompt = [
    'Create a daily food analysis from this logged food. Write like a sharp coach who actually looked at the data, not a script that restates numbers with adjectives.',
    'Return JSON with keys: title, summary, positives, watch, next_actions.',
    'Limits: summary <= 45 words; each array <= 3 short strings.',
    '',
    'HARD RULES — violating these makes the report useless:',
    '- Never just restate a macro number with a generic adjective ("220g protects muscle"). State what it actually means for THIS day specifically.',
    '- Find the one most interesting or concerning thing in the data — a pattern, a tradeoff, a contradiction, a risk — and lead with that, not a summary of all metrics.',
    '- If something is genuinely fine, say so briefly and move on. Do not pad with filler praise for hitting an easy target.',
    '- Reference specific foods or choices from the log when relevant, not just macro totals.',
    '- If health metrics show something notable (poor sleep, high strain, low steps) connect it causally to the food day — do not just list both side by side.',
    '- next_actions must be concrete and specific to tomorrow/this week, not generic advice ("eat more protein").',
    '',
    'If previous weekly focus goals are present, state plainly whether today helped or hurt them — do not hedge.',
    'Use health metrics as activity, sleep, recovery, and body trend context. Do not subtract calories_out from food calories.',
    'Use the user goal profile as the coaching frame for belly/visceral fat loss and muscle preservation.',
    JSON.stringify({
      user_goal_profile: USER_GOAL_PROFILE,
      daily_log: compactAnalysis(analysis),
      health_metrics: compactHealthMetrics(healthMetrics),
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

export async function generateWeeklyClaudeReport(
  analyses: FoodAnalysis[],
  previousWeekly?: unknown,
  healthMetrics: HealthDailyMetrics[] = []
) {
  const scoreDays = analyses.map(compactAnalysis)
  const fallback = reportFallback(
    'Weekly nutrition analysis',
    `${analyses.length} days analyzed. Review repeated sodium, protein, and fiber patterns.`,
  )
  const prompt = [
    'Create a progressive weekly nutrition analysis from these separated daily logs.',
    'Compare against the previous weekly report when present.',
    'Return JSON with keys: title, summary, positives, watch, progress, focus_goals, next_actions.',
    'Limits: summary <= 55 words; each array <= 3 short strings.',
    'Focus on repeated food patterns, specific day-to-day differences, and whether the week supported belly/visceral fat loss while preserving muscle.',
    'Use health metrics to connect food choices with activity, sleep, recovery, and body trend. Do not subtract calories_out from food calories.',
    JSON.stringify({
      user_goal_profile: USER_GOAL_PROFILE,
      targets: TARGETS,
      days: scoreDays,
      health_metrics: healthMetrics.map(compactHealthMetrics).filter(Boolean),
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
