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
  food_flags?: string[]
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
    'Late sleep (post-midnight) is the most under-addressed lever for visceral fat specifically, since it compresses the low-cortisol window when belly fat mobilization is most efficient. Worth surfacing when relevant, but do not over-index on it daily if nothing changed.',
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
    calories_kcal_rest_day: 1800,
    calories_kcal_gym_day: '1850-1900',
    protein_g_min: 140,
    sodium_mg_max: 1500,
    sodium_mg_max_gym_day: 1700,
    fiber_g_min: 25,
    carbs_g_range_rest_day: '150-200',
    carbs_g_range_gym_day: '180-220',
    is_locked: true,
    locked_rule: 'These targets are the established, already-correct protocol — not a starting suggestion. NEVER recommend a different calorie target (higher or lower) based on a single day of data, one bad sleep night, or one big deficit day. One day outside the normal range is not a crisis and does not justify a "recovery window" with higher calories, a refeed, or any deviation from these exact numbers. Only flag a possible need for protocol adjustment if a clear pattern repeats across 4+ consecutive days, and even then frame it as "worth discussing," never as a unilateral new target.',
  },
  fixed_breakfast: {
    name: 'Breakfast bowl',
    foods: ['Fage 0% Greek yogurt', 'chia seeds', 'flaxseeds', 'almonds', 'pumpkin seeds', 'blueberries'],
    macros: { calories_kcal: 497, protein_g: 51 },
    note: 'Every day starts with this bowl unless the log explicitly says otherwise.',
  },
  meal_rotation: [
    'WFH tuna masala template',
    'Avocado toast on Ezekiel zero-sodium bread (Ezekiel Low Sodium confirmed: 0mg sodium, 80 cal/slice — this is the standard bread now, not a regular-sodium substitute)',
    'Soya stir fry',
    'Chana dal',
    'Strict Chipotle bowl: no salsa, no cheese, ever',
    'Office salad followed by salmon rice bowl at home',
    'Creamy Cottage Cheese Chickpea Pasta (Banza pasta + Good Culture Low Sodium cottage cheese blended into sauce + chicken — roughly 520 cal, 65g protein, 200mg sodium per serving; high-protein, low-sodium dinner alternative)',
    'Spiced Lemon Chicken & Crispy Potatoes (one-pan roasted dinner, ~490 cal, 50g protein, ~150mg sodium — low-sodium variety option)',
  ],
  grain_substitution_note: 'Quinoa is the preferred grain swap over white rice or basmati when available — roughly double the protein and has fiber (basmati has none). 185g cooked quinoa is the standard portion (~222 cal, 8.1g protein, 13mg sodium, 39g carbs, 5.2g fiber). Rice remains the default when quinoa is not on hand.',
  office_salad_note: 'Office salad portions can vary — chicken cube quantity is sometimes scaled up (e.g. 1.25x) for a higher-protein lunch, which is a deliberate good choice, not overeating.',
  sleep_context: 'Typical sleep window is ~1:00 AM to 7:30 AM (6.5h), later than ideal. Root cause is usually high cognitive load from late-night app building, AI coursework, or job search work — not poor sleep hygiene per se. Avoid generic "improve sleep hygiene" advice; the real lever is stopping cognitively demanding work by ~11:30 PM, not supplements or environment alone.',
  supplement_timing_notes: 'D3+K2 needs dietary fat to absorb properly — take with breakfast normally. On Sunday fasting days, take D3+K2 in the evening alongside the Fairlife shake instead of on an empty stomach in the morning.',
  data_quality_note: 'The food database used for ad-hoc quick-add items (USDA branded search) is occasionally unreliable for generic staples like plain quinoa or rice, sometimes returning mismatched or implausible branded entries. Locked custom values are used instead for staples. Do not flag minor inconsistencies in historical quick-add entries as the user\'s error — they were data quality issues, not dietary choices.',
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
    food_flags: [],
  }
}

function extractJson(text: string) {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) throw new Error('Claude did not return JSON')
  return JSON.parse(text.slice(start, end + 1))
}

function safeText(value: unknown): string {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') {
    // Claude sometimes returns {action: "...", reason: "..."} instead of a plain string —
    // pull the most likely text field instead of producing "[object Object]"
    const obj = value as Record<string, unknown>
    const candidate = obj.action || obj.text || obj.item || obj.description || obj.value
    if (typeof candidate === 'string') return candidate
    return Object.values(obj).filter((v) => typeof v === 'string').join(' — ')
  }
  return String(value)
}

function normalizeReport(value: Partial<ClaudeNutritionReport>, fallback: ClaudeNutritionReport): ClaudeNutritionReport {
  return {
    title: typeof value.title === 'string' ? value.title.slice(0, 80) : fallback.title,
    summary: typeof value.summary === 'string' ? value.summary.slice(0, 500) : fallback.summary,
    positives: Array.isArray(value.positives) ? value.positives.map(safeText).slice(0, 4) : fallback.positives,
    watch: Array.isArray(value.watch) ? value.watch.map(safeText).slice(0, 4) : fallback.watch,
    next_actions: Array.isArray(value.next_actions) ? value.next_actions.map(safeText).slice(0, 4) : fallback.next_actions,
    progress: Array.isArray(value.progress) ? value.progress.map(safeText).slice(0, 4) : fallback.progress,
    focus_goals: Array.isArray(value.focus_goals) ? value.focus_goals.map(safeText).slice(0, 4) : fallback.focus_goals,
    food_flags: Array.isArray(value.food_flags) ? value.food_flags.map(safeText).slice(0, 3) : fallback.food_flags,
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

export async function generateDailyClaudeReport(
  analysis: FoodAnalysis,
  previousWeekly?: unknown,
  healthMetrics?: HealthDailyMetrics | null,
  recentDaysTrend?: Array<{ date: string; day: string; totals: unknown }>
) {
  const fallback = reportFallback('Daily food analysis', analysis.headline, analysis)
  const prompt = [
    'You are reasoning about what today actually DID to this person\'s body, not describing what they ate. Write a daily report with exactly this structure:',
    '',
    'VOICE: Write like a coach who actually looked at this specific person\'s day and noticed something, not a lab report. Use "you" naturally. Reference specific logged items by name (e.g. "that quinoa add at dinner", "the salmon rice bowl") and specific numbers when they tell a story (e.g. "134 active zone minutes", "1,341 kcal deficit") rather than only talking in vague categories like "protein" or "training load". Specificity is what makes this feel like it was actually read, not templated.',
    '',
    'TREND AWARENESS (important): You are given the last 5 days of totals alongside today. Use them. If today repeats a pattern from recent days (e.g. "third day this week over 200g protein", "sodium has stayed under 1300mg for 4 days straight", "this is the second calorie overage in 3 days"), say so explicitly — that is real information a single isolated day cannot show, and it is more valuable than restating today\'s numbers alone. If today is genuinely different from the recent pattern, say that instead. Do not skip this — comparing today against the recent days is what separates an actual read of the data from a templated recap.',
    '',
    '1. TITLE: the net physiological direction of today in plain, human language — did the body move toward muscle preservation + fat loss, or away from it. Sound like a person said this, not a verdict stamp. Do not just preview the summary — make it earn a second sentence.',
    '',
    '2. SUMMARY (<=55 words): Reason through this explicitly before writing: given the calorie balance (intake vs activity_calories/calories_out), protein relative to training stimulus, and active_zone_minutes/cardio_load from training, what is the actual likely effect on muscle tissue and fat stores today. Then connect it to the recent-days trend if relevant. Must say something the title did not already say — no redundant restating between title and summary.',
    '',
    '3. food_flags (0-3 items, only if relevant): name the SPECIFIC food or quantity today that worked against the goal — by name, with the actual amount and why it matters for THIS goal. Empty array if nothing was actually a problem.',
    '',
    '4. watch (<=3 items): risks or compounding patterns worth tracking — explain the mechanism, referencing specific numbers and the recent-days trend where relevant, not just that it happened today.',
    '',
    '5. positives (<=3 items): genuine wins that required an actual choice or effort, named specifically (which food, which choice). Skip anything that is an easy default for this person.',
    '',
    '6. next_actions (0-3 items, ranked, fewer is fine): the first item is the single most important lever given everything in this data, including the trend. Generic protocol reminders ("eat enough protein", "sleep more") are NOT a next_action unless something about TODAY or the recent trend specifically makes that the priority right now over everything else. If there is no real new lever beyond "keep doing what you are doing," say that plainly instead of inventing a directive.',
    '',
    'HARD RULES:',
    '- Never describe what happened without stating its physiological consequence. "You ate X, did Y steps" is not analysis — "X plus Y likely means Z for muscle/fat" is.',
    '- Never critique how the user logs data (number of entries, app usage). Only critique what was eaten and in what amount.',
    '- If health metrics show a notable signal (poor sleep, high cardio_load, low readiness, elevated resting heart rate) connect it causally to what the body needed today and whether nutrition met that need.',
    '- If a day was genuinely fine with no real story, say so in one short sentence and do not manufacture drama.',
    '- If previous weekly focus goals are present, state plainly whether today helped or hurt them.',
    '- Every item in positives, watch, next_actions, and food_flags must be a single plain string sentence — never a nested object or key-value structure.',
    '- Do not end with a question. This is a standalone report, not a conversation.',
    '- The system has NO visibility into what type of day tomorrow will be (gym or rest) — that is chosen by the user each morning and is not available data. NEVER state "tomorrow is a rest day" or "tomorrow is a gym day" as fact, even if it seems like a likely pattern. If giving forward-looking advice, phrase it conditionally ("if tomorrow is a rest day...") or address recovery/sleep without assuming tomorrow\'s training status.',
    '- The daily_targets in the user goal profile are the established, correct protocol, not a draft. NEVER suggest a different calorie number (higher or lower) than the locked rest-day or gym-day target based on a single day\'s data — no "recovery window," no refeed day, no generic sports-science advice about post-deficit calorie bumps. A single big deficit day with adequate protein is not a problem to be solved with more food. Only raise the possibility of a target change if the SAME issue repeats across 4+ consecutive logged days, and even then phrase it as worth reviewing, not as a new instruction to follow tomorrow.',
    '',
    'Return JSON with keys: title, summary, positives, watch, next_actions, food_flags.',
    JSON.stringify({
      user_goal_profile: USER_GOAL_PROFILE,
      daily_log: compactAnalysis(analysis),
      recent_days_trend: recentDaysTrend || [],
      health_metrics: compactHealthMetrics(healthMetrics),
      previous_weekly_report: previousWeekly || null,
    }),
  ].join('\n')

  try {
    return normalizeReport(await callClaude(prompt, 850), fallback)
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
    'The daily_targets in the user goal profile are the established, locked protocol. Do not propose a different calorie target casually. Only suggest reviewing the targets if the SAME deviation (over or under) shows up across most days this week — that is a genuine pattern worth surfacing. A single outlier day within the week is normal variance, not a signal.',
    'The system has no visibility into future day types (gym vs rest) — never assert what an upcoming day will be, only reference what has already happened.',
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
