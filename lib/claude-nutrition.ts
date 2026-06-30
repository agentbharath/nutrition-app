import { FoodAnalysis } from './nutrition-monitor'
import { TARGETS } from './meals'
import { HealthDailyMetrics, compactHealthMetrics } from './health'

export interface ClaudeNutritionReport {
  // Core sections (daily)
  title: string
  overall_assessment: string
  biggest_wins: string[]
  biggest_opportunities: string[]
  food_analysis: string
  recovery_analysis: string
  pattern_detection: string[]
  personalized_recommendations: string[]
  food_flags?: string[]

  // Weekly-specific sections
  weekly_progress?: string
  goal_progress?: string
  nutrition_trends?: string[]
  activity_trends?: string[]
  habit_score?: string
  best_meal?: string
  meal_suggestions?: string[]
  risks?: string[]
  celebration?: string

  // Legacy fields kept so old saved reports and any code still
  // reading them do not break
  summary?: string
  positives?: string[]
  watch?: string[]
  next_actions?: string[]
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

const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6'

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
    overall_assessment: summary,
    biggest_wins: analysis?.positives || [],
    biggest_opportunities: analysis?.watch || [],
    food_analysis: '',
    recovery_analysis: '',
    pattern_detection: [],
    personalized_recommendations: analysis?.suggestions || [],
    food_flags: [],
  }
}

function extractJson(text: string) {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    console.error('[extractJson] No JSON found in Claude response. First 200 chars:', text.slice(0, 200))
    throw new Error('Claude did not return JSON')
  }
  try {
    return JSON.parse(text.slice(start, end + 1))
  } catch (e) {
    console.error('[extractJson] JSON parse failed. Response length:', text.length, 'Error:', e)
    throw e
  }
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
    title: typeof value.title === 'string' ? value.title.slice(0, 90) : fallback.title,
    overall_assessment: typeof value.overall_assessment === 'string' ? value.overall_assessment.slice(0, 600) : fallback.overall_assessment,
    biggest_wins: Array.isArray(value.biggest_wins) ? value.biggest_wins.map(safeText).slice(0, 4) : fallback.biggest_wins,
    biggest_opportunities: Array.isArray(value.biggest_opportunities) ? value.biggest_opportunities.map(safeText).slice(0, 4) : fallback.biggest_opportunities,
    food_analysis: typeof value.food_analysis === 'string' ? value.food_analysis.slice(0, 700) : fallback.food_analysis,
    recovery_analysis: typeof value.recovery_analysis === 'string' ? value.recovery_analysis.slice(0, 600) : fallback.recovery_analysis,
    pattern_detection: Array.isArray(value.pattern_detection) ? value.pattern_detection.map(safeText).slice(0, 5) : fallback.pattern_detection,
    personalized_recommendations: Array.isArray(value.personalized_recommendations) ? value.personalized_recommendations.map(safeText).slice(0, 3) : fallback.personalized_recommendations,
    food_flags: Array.isArray(value.food_flags) ? value.food_flags.map(safeText).slice(0, 3) : fallback.food_flags,
    // Weekly-only sections
    weekly_progress: typeof value.weekly_progress === 'string' ? value.weekly_progress.slice(0, 600) : undefined,
    goal_progress: typeof value.goal_progress === 'string' ? value.goal_progress.slice(0, 600) : undefined,
    nutrition_trends: Array.isArray(value.nutrition_trends) ? value.nutrition_trends.map(safeText).slice(0, 5) : undefined,
    activity_trends: Array.isArray(value.activity_trends) ? value.activity_trends.map(safeText).slice(0, 5) : undefined,
    habit_score: typeof value.habit_score === 'string' ? value.habit_score.slice(0, 400) : undefined,
    best_meal: typeof value.best_meal === 'string' ? value.best_meal.slice(0, 400) : undefined,
    meal_suggestions: Array.isArray(value.meal_suggestions) ? value.meal_suggestions.map(safeText).slice(0, 3) : undefined,
    risks: Array.isArray(value.risks) ? value.risks.map(safeText).slice(0, 4) : undefined,
    celebration: typeof value.celebration === 'string' ? value.celebration.slice(0, 300) : undefined,
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
    'You are a coach explaining yesterday to this person — not a dashboard restating numbers. The app already shows them their calories, macros, meals, steps, and sleep. Your job is to explain WHY those numbers matter, what patterns are emerging, and what to actually do next. Write all narrative fields as flowing prose paragraphs, not bullet fragments.',
    '',
    'VOICE: Reference specific logged foods by name (e.g. "the salmon rice bowl", "that quinoa add at dinner") and specific numbers that tell a story (e.g. "134 active zone minutes"), not vague categories. Sound like a person who actually looked at this day, not a template.',
    '',
    'TREND AWARENESS: You are given the last 5 days of totals. Use them to spot real patterns — "third day this week over 200g protein", "sodium has stayed under 1300mg for 4 days straight". This is what separates real analysis from a recap of one isolated day. If there is too little history to spot a pattern yet, say so briefly rather than inventing one.',
    '',
    'Produce these sections:',
    '',
    '1. title: A short, human verdict on the day — sound like a person said it, not a stamp.',
    '',
    '2. overall_assessment (2-3 sentences): Was yesterday a good day for the muscle-preservation + fat-loss goal? What was the single biggest success? What was the single biggest concern? This is the headline of the whole report — the rest of the sections support it.',
    '',
    '3. biggest_wins (2-4 items): Specific things done well, each written as a full sentence that also explains WHY it helps the goal (not just "high protein" but what high protein against this training load actually does). Skip anything that is an easy default for this person — only genuine choices count.',
    '',
    '4. biggest_opportunities (1-3 items): Do NOT phrase these as criticism. For each: name what the opportunity is, explain why it matters and whether it actually affects progress, and state its priority in plain language (e.g. "this is a high-priority one" or "minor, not urgent"). Something like "protein is consistently higher than necessary" framed as low priority is a valid opportunity — not everything has to be a crisis.',
    '',
    '5. food_analysis (one paragraph, not a macro list): Discuss which specific foods were excellent choices and why, which foods contributed most toward the goal, anything that added calories without much benefit, portion sizes worth noting, any missing food groups or low variety, and overall meal balance. Reference real items from today\'s log by name.',
    '',
    '6. recovery_analysis (one paragraph): Weave together activity, sleep, readiness, and training load into a single narrative about what the body needed and whether it got it — do not just list the numbers next to each other. Active zone minutes and cardio_load indicate real training stress, distinct from raw steps.',
    '',
    '7. pattern_detection (1-4 items): Patterns emerging across the recent days of data — protein trending high, sodium staying controlled, weekend fasting creating swings, activity increasing, sleep debt building, etc. If there is not yet enough history for a real pattern, say so plainly instead of manufacturing one.',
    '',
    '8. personalized_recommendations (2-3 items, ranked): Specific, concrete actions for today — not generic advice. "Prioritize an earlier bedtime tonight" beats "sleep more." If nutrition itself needs no change and the real lever is something else (recovery, timing, variety), say that plainly.',
    '',
    '9. food_flags (0-3 items, only if genuinely relevant): a specific food or quantity that worked against the goal, named with amount. Empty array if nothing was actually a problem — do not force one.',
    '',
    'HARD RULES:',
    '- Every list item must be a single plain string sentence — never a nested object.',
    '- Do not end with a question. This is a standalone report, not a conversation.',
    '- Never critique how the user logs data (number of entries, app usage). Only critique what was eaten and in what amount.',
    '- The system has NO visibility into tomorrow\'s gym/rest status — never assert it as fact. Phrase forward-looking advice conditionally or focus on recovery without assuming training status.',
    '- The daily_targets in the user goal profile are the established, correct protocol. NEVER suggest a different calorie number based on a single day\'s data — no "recovery window," no refeed day. Only raise a target review if the SAME issue repeats across 4+ consecutive days.',
    '- If previous weekly focus goals are present, state plainly whether yesterday helped or hurt them.',
    '',
    'Return JSON with keys: title, overall_assessment, biggest_wins, biggest_opportunities, food_analysis, recovery_analysis, pattern_detection, personalized_recommendations, food_flags.',
    JSON.stringify({
      user_goal_profile: USER_GOAL_PROFILE,
      daily_log: compactAnalysis(analysis),
      recent_days_trend: recentDaysTrend || [],
      health_metrics: compactHealthMetrics(healthMetrics),
      previous_weekly_report: previousWeekly || null,
    }),
  ].join('\n')

  try {
    return normalizeReport(await callClaude(prompt, 2000), fallback)
  } catch (error) {
    console.error('[Claude Daily Report Error]', error instanceof Error ? error.message : error)
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
    'You are writing a weekly report focused on TRENDS, not individual days — the daily reports already covered each day. Write all narrative fields as flowing prose, not bullet fragments. Never write a raw average like "average calories = X" — always interpret what it means.',
    '',
    'Produce these sections:',
    '',
    '1. title: A short human verdict on the week.',
    '',
    '2. weekly_progress (2-3 sentences): The overall shape of the week in plain language — e.g. "excellent consistency despite one fasting day" — not a metrics recap.',
    '',
    '3. goal_progress (one paragraph): Discuss fat loss trajectory, weight trend, body fat trend, visceral fat, and muscle preservation using the body_snapshot in the user goal profile plus this week\'s data as supporting evidence.',
    '',
    '4. nutrition_trends (2-4 items): Protein consistency, fiber trend, sodium trend, food variety, meal adherence across the week — each as a real observation, not a single number.',
    '',
    '5. activity_trends (2-4 items): Activity level changes, recovery balance, workout consistency, rest day quality across the week.',
    '',
    '6. habit_score (1-2 sentences): Comment on logging consistency, meal planning, sleep consistency, and exercise adherence as a holistic read of the week\'s habits.',
    '',
    '7. best_meal (1-2 sentences): Pick one specific meal from the week that stood out and explain why — by name, with what made it a strong choice.',
    '',
    '8. meal_suggestions (1-3 items): Concrete, specific swaps — never generic ("eat more vegetables"). Instead something like "swap one protein shake this week for Greek yogurt and berries to add micronutrient variety while keeping protein high."',
    '',
    '9. risks (1-4 items, only if real): Possible risks visible in the data — overtraining, sleep debt, excessive protein crowding out variety, low healthy fats, low micronutrient variety, weekend overeating, undereating after workouts. Only include genuine signals from this week\'s actual data, not a generic checklist.',
    '',
    '10. celebration (1 sentence): Always end the week on something genuinely worth celebrating from this week\'s data.',
    '',
    '11. personalized_recommendations (2-3 items, ranked): The most important levers for next week specifically.',
    '',
    'HARD RULES:',
    '- Every list item must be a single plain string sentence — never a nested object.',
    '- Compare against the previous weekly report when present — state plainly whether last week\'s recommendations were followed through on.',
    '- The daily_targets in the user goal profile are the established, locked protocol. Only suggest reviewing the targets if the SAME deviation shows up across MOST days this week — a single outlier day is normal variance, not a signal.',
    '- The system has no visibility into future day types (gym vs rest) — never assert what an upcoming day will be.',
    '- Use health metrics to connect food choices with activity, sleep, recovery, and body trend across the week. Do not subtract calories_out from food calories.',
    '',
    'Return JSON with keys: title, weekly_progress, goal_progress, nutrition_trends, activity_trends, habit_score, best_meal, meal_suggestions, risks, celebration, personalized_recommendations.',
    JSON.stringify({
      user_goal_profile: USER_GOAL_PROFILE,
      targets: TARGETS,
      days: scoreDays,
      health_metrics: healthMetrics.map(compactHealthMetrics).filter(Boolean),
      previous_weekly_report: previousWeekly || null,
    }),
  ].join('\n')

  try {
    return normalizeReport(await callClaude(prompt, 2400), fallback)
  } catch (error) {
    console.error(error)
    return fallback
  }
}
