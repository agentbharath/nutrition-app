import { DayType } from './supabase'

export interface Macro {
  cal: number
  protein: number
  sodium: number
  fiber: number
  carbs: number
}

export interface MealItem {
  name: string
  brand?: string
  amount: string
  cal: number
  protein: number
  sodium: number
  fiber: number
  carbs: number
}

export interface Meal {
  id: string
  name: string
  items: MealItem[]
  totals: Macro
  notes?: string
}

export interface DayTemplate {
  dayType: DayType
  label: string
  emoji: string
  description: string
  breakfast: Meal
  lunch: Meal
  shake?: Meal
  dinner: Meal
  snack?: Meal
  targets: Macro
  gymNotes?: string
}

// ── BREAKFAST (same every day) ────────────────────────────────
const BREAKFAST: Meal = {
  id: 'breakfast',
  name: 'Breakfast Bowl',
  items: [
    { name: 'Fage 0% Greek Yogurt', brand: 'Fage', amount: '400g', cal: 212, protein: 42, sodium: 153, fiber: 0, carbs: 12 },
    { name: 'Chia Seeds', amount: '1 tbsp', cal: 58, protein: 2, sodium: 2, fiber: 4, carbs: 5 },
    { name: 'Flaxseed Powder', amount: '1 tsp', cal: 15, protein: 0.5, sodium: 1, fiber: 1, carbs: 1 },
    { name: 'Almonds', amount: '10 whole', cal: 82, protein: 3, sodium: 0, fiber: 1.7, carbs: 3 },
    { name: 'Pumpkin Seeds', amount: '1 tbsp', cal: 46, protein: 2.5, sodium: 0, fiber: 0.5, carbs: 2 },
    { name: 'Frozen Blueberries', brand: 'Any', amount: '1 cup', cal: 84, protein: 1, sodium: 1, fiber: 3.6, carbs: 21 },
  ],
  totals: { cal: 497, protein: 51, sodium: 157, fiber: 10.8, carbs: 44 },
  notes: 'Morning supplement: Sports Research D3+K2 (1 softgel with this meal)',
}

// ── TUNA MASALA (WFH lunch) ───────────────────────────────────
const TUNA_MASALA: Meal = {
  id: 'tuna_masala',
  name: 'Tuna Masala',
  items: [
    { name: 'Kirkland Albacore Tuna', brand: 'Kirkland', amount: '1 can (153g)', cal: 210, protein: 43, sodium: 480, fiber: 0, carbs: 0 },
    { name: 'Red Onion', amount: '185g (full)', cal: 74, protein: 1.7, sodium: 7, fiber: 2.8, carbs: 17 },
    { name: 'Tomato', amount: '110g', cal: 20, protein: 1, sodium: 5, fiber: 1.3, carbs: 5 },
    { name: 'Avocado Oil', amount: '<1g', cal: 8, protein: 0, sodium: 0, fiber: 0, carbs: 0 },
    { name: 'Garam Masala', amount: '1 tsp', cal: 8, protein: 0.3, sodium: 4, fiber: 0.5, carbs: 1.5 },
    { name: 'Cumin Powder', amount: '1 tsp', cal: 8, protein: 0.4, sodium: 4, fiber: 0.2, carbs: 0.9 },
    { name: 'Chili Powder', amount: '1 tsp', cal: 8, protein: 0.4, sodium: 37, fiber: 0.7, carbs: 1.4 },
  ],
  totals: { cal: 336, protein: 46.8, sodium: 537, fiber: 6.5, carbs: 25.8 },
  notes: 'Skip hot sauce on gym days — stomach sensitive post workout',
}

const TUNA_MASALA_GYM: Meal = {
  ...TUNA_MASALA,
  id: 'tuna_masala_gym',
  name: 'Tuna Masala + Rice',
  items: [
    ...TUNA_MASALA.items,
    { name: 'White Rice cooked', amount: '½ cup', cal: 100, protein: 2, sodium: 0, fiber: 0.3, carbs: 22 },
  ],
  totals: { cal: 436, protein: 48.8, sodium: 537, fiber: 6.8, carbs: 47.8 },
  notes: 'Extra rice for gym day carbs. Skip hot sauce.',
}

// ── FAIRLIFE ──────────────────────────────────────────────────
const FAIRLIFE: Meal = {
  id: 'fairlife',
  name: 'Fairlife Core Power',
  items: [
    { name: 'Fairlife Core Power Elite', brand: 'Fairlife', amount: '1 bottle (42g protein)', cal: 230, protein: 42, sodium: 280, fiber: 0, carbs: 12 },
  ],
  totals: { cal: 230, protein: 42, sodium: 280, fiber: 0, carbs: 12 },
  notes: 'Post-gym shake. Skip on Chipotle days.',
}

// ── VITA COCO ─────────────────────────────────────────────────
const VITA_COCO: Meal = {
  id: 'vita_coco',
  name: 'Vita Coco (Post-Gym)',
  items: [
    { name: 'Vita Coco Organic Coconut Water', brand: 'Vita Coco', amount: '500ml (full carton)', cal: 90, protein: 0, sodium: 30, fiber: 0, carbs: 23 },
  ],
  totals: { cal: 90, protein: 0, sodium: 30, fiber: 0, carbs: 23 },
  notes: 'Drink immediately after training. 979mg potassium replaces sweat loss.',
}

// ── WFH REGULAR DINNER ────────────────────────────────────────
const WFH_DINNER: Meal = {
  id: 'wfh_dinner',
  name: 'Avocado Toast + Eggs',
  items: [
    { name: 'Ezekiel Low Sodium Bread', brand: 'Food for Life', amount: '3 slices', cal: 240, protein: 12, sodium: 0, fiber: 9, carbs: 45 },
    { name: 'Avocado', amount: '1 full', cal: 240, protein: 3, sodium: 10, fiber: 10, carbs: 12 },
    { name: 'Whole Eggs', amount: '2', cal: 140, protein: 12, sodium: 140, fiber: 0, carbs: 1 },
    { name: 'Kirkland Frozen Veggies', brand: 'Kirkland', amount: '1.5 cups', cal: 53, protein: 3, sodium: 23, fiber: 3, carbs: 14 },
    { name: 'Once Again Peanut Butter', brand: 'Once Again Organic', amount: '1 tbsp (rest day)', cal: 95, protein: 4, sodium: 0, fiber: 1, carbs: 3 },
  ],
  totals: { cal: 768, protein: 34, sodium: 173, fiber: 23, carbs: 75 },
  notes: 'Ezekiel Low Sodium — 0mg sodium, 80 cal/slice. Skip PB on gym days.',
}

const WFH_DINNER_GYM: Meal = {
  ...WFH_DINNER,
  id: 'wfh_dinner_gym',
  name: 'Avocado Toast + Eggs (Gym)',
  items: WFH_DINNER.items.slice(0, 4),
  totals: { cal: 673, protein: 30, sodium: 173, fiber: 22, carbs: 72 },
  notes: 'No peanut butter on gym days.',
}

// ── WFH SNACKS ────────────────────────────────────────────────
const WFH_SNACK_REST: Meal = {
  id: 'wfh_snack_rest',
  name: 'Dates + Oranges',
  items: [
    { name: 'Deglet Noor Dates', brand: 'Desert Valley', amount: '2 dates', cal: 44, protein: 0.4, sodium: 0, fiber: 1.2, carbs: 12 },
    { name: 'Oranges', amount: '2 medium', cal: 130, protein: 2.4, sodium: 0, fiber: 6.8, carbs: 30 },
  ],
  totals: { cal: 174, protein: 2.8, sodium: 0, fiber: 8, carbs: 42 },
}

const WFH_SNACK_GYM: Meal = {
  id: 'wfh_snack_gym',
  name: '2 Dates',
  items: [
    { name: 'Deglet Noor Dates', brand: 'Desert Valley', amount: '2 dates', cal: 44, protein: 0.4, sodium: 0, fiber: 1.2, carbs: 12 },
  ],
  totals: { cal: 44, protein: 0.4, sodium: 0, fiber: 1.2, carbs: 12 },
}

// ── SOYA DINNER ───────────────────────────────────────────────
const SOYA_DINNER: Meal = {
  id: 'soya_dinner',
  name: 'Soya Stir Fry + Rice',
  items: [
    { name: 'Soya Chunks dry', amount: '50g', cal: 173, protein: 26, sodium: 1, fiber: 6.5, carbs: 10 },
    { name: 'Kirkland Frozen Veggies', brand: 'Kirkland', amount: '2 cups', cal: 70, protein: 6, sodium: 30, fiber: 8, carbs: 28 },
    { name: 'Whole Egg', amount: '1', cal: 70, protein: 6, sodium: 65, fiber: 0, carbs: 0.5 },
    { name: 'Avocado Oil', amount: '1 tsp', cal: 40, protein: 0, sodium: 0, fiber: 0, carbs: 0 },
    { name: 'Spices (garam+cumin+chili)', amount: 'mixed', cal: 24, protein: 1.1, sodium: 45, fiber: 1.4, carbs: 3.8 },
    { name: 'White Rice cooked', amount: '1 cup', cal: 200, protein: 4, sodium: 0, fiber: 0.6, carbs: 44 },
  ],
  totals: { cal: 577, protein: 43.1, sodium: 141, fiber: 16.5, carbs: 86.3 },
  notes: 'Boil soya chunks 15 min, drain, stir fry with veggies and spices.',
}

// ── CHANA DAL DINNER ─────────────────────────────────────────
const CHANA_DINNER: Meal = {
  id: 'chana_dinner',
  name: 'Chana Dal + Rice',
  items: [
    { name: 'Chana Dal cooked', amount: '150g', cal: 180, protein: 12, sodium: 36, fiber: 9, carbs: 27 },
    { name: 'Red Onion', amount: '100g', cal: 40, protein: 0.9, sodium: 4, fiber: 1.5, carbs: 9 },
    { name: 'Tomato', amount: '100g', cal: 18, protein: 0.9, sodium: 5, fiber: 1.2, carbs: 4 },
    { name: 'Avocado Oil', amount: '1 tsp', cal: 40, protein: 0, sodium: 0, fiber: 0, carbs: 0 },
    { name: 'Spices', amount: 'cumin+turmeric+chili', cal: 20, protein: 0.8, sodium: 10, fiber: 1.5, carbs: 3 },
    { name: 'Whole Egg', amount: '1', cal: 70, protein: 6, sodium: 65, fiber: 0, carbs: 0.5 },
    { name: 'Kirkland Frozen Veggies', brand: 'Kirkland', amount: '1 cup', cal: 35, protein: 2, sodium: 15, fiber: 2, carbs: 7 },
    { name: 'White Rice cooked', amount: '1 cup', cal: 200, protein: 4, sodium: 0, fiber: 0.6, carbs: 44 },
  ],
  totals: { cal: 603, protein: 26.6, sodium: 135, fiber: 15.8, carbs: 94.5 },
  notes: 'Tadka: heat oil, splutter cumin, add turmeric+chili, pour over dal. Add lemon. Skip salt.',
}

// ── CHIPOTLE ─────────────────────────────────────────────────
const CHIPOTLE_LUNCH: Meal = {
  id: 'chipotle_lunch',
  name: 'Chipotle Double High Protein Bowl',
  items: [
    { name: 'Double Adobo Chicken', brand: 'Chipotle', amount: '2×4oz', cal: 360, protein: 64, sodium: 620, fiber: 0, carbs: 0 },
    { name: 'Light White Rice', brand: 'Chipotle', amount: '~2oz', cal: 105, protein: 2, sodium: 175, fiber: 0, carbs: 22 },
    { name: 'Black Beans', brand: 'Chipotle', amount: '4oz', cal: 130, protein: 8, sodium: 210, fiber: 7, carbs: 23 },
    { name: 'Fajita Veggies', brand: 'Chipotle', amount: '2oz', cal: 20, protein: 1, sodium: 150, fiber: 1, carbs: 5 },
    { name: 'Extra Romaine', brand: 'Chipotle', amount: 'extra', cal: 10, protein: 0, sodium: 0, fiber: 2, carbs: 2 },
  ],
  totals: { cal: 625, protein: 75, sodium: 1155, fiber: 10, carbs: 52 },
  notes: '⚠️ ORDER: NO salsa, NO cheese. Saves 740mg sodium. No Fairlife on this day.',
}

const CHIPOTLE_DINNER: Meal = {
  id: 'chipotle_dinner',
  name: 'Eggs + Avocado + Almonds',
  items: [
    { name: 'Whole Eggs', amount: '2', cal: 140, protein: 12, sodium: 140, fiber: 0, carbs: 1 },
    { name: 'Kirkland Frozen Veggies', brand: 'Kirkland', amount: '1 cup', cal: 35, protein: 2, sodium: 15, fiber: 2, carbs: 7 },
    { name: 'Avocado', amount: '½', cal: 120, protein: 1.5, sodium: 5, fiber: 5, carbs: 6 },
    { name: 'Almonds', amount: '25 whole', cal: 205, protein: 7.5, sodium: 0, fiber: 3.5, carbs: 7 },
  ],
  totals: { cal: 500, protein: 23, sodium: 160, fiber: 10.5, carbs: 21 },
}

// ── OFFICE LUNCH ─────────────────────────────────────────────
const OFFICE_LUNCH: Meal = {
  id: 'office_lunch',
  name: 'Office Salad (No Dressing)',
  items: [
    { name: 'Mixed Greens', amount: '3 cups / 3 handfuls', cal: 23, protein: 2.2, sodium: 53, fiber: 3, carbs: 5 },
    { name: 'Chicken Cubes grilled', amount: '150g / 15-18 medium cubes', cal: 247, protein: 46.5, sodium: 111, fiber: 0, carbs: 0 },
    { name: 'Quinoa cooked', amount: '1 tbsp dry', cal: 14, protein: 0.5, sodium: 1, fiber: 0.2, carbs: 3 },
    { name: 'Chickpeas', amount: '4 tbsp / ~60 chickpeas', cal: 100, protein: 6, sodium: 8, fiber: 4.8, carbs: 17 },
    { name: 'Grated Carrot', amount: '30g / ½ small carrot', cal: 12, protein: 0.3, sodium: 20, fiber: 0.9, carbs: 3 },
    { name: 'Broccoli raw', amount: '150g / 20-25 small florets', cal: 51, protein: 4.2, sodium: 48, fiber: 3.9, carbs: 10 },
    { name: 'Cucumber', amount: '100g / 8-10 slices', cal: 15, protein: 0.6, sodium: 2, fiber: 0.5, carbs: 3 },
  ],
  totals: { cal: 462, protein: 60.3, sodium: 243, fiber: 13.3, carbs: 41 },
  notes: 'No dressing. See visual guide: 3 handfuls greens, palmful chicken cubes.',
}

const OFFICE_DINNER: Meal = {
  id: 'office_dinner',
  name: 'Salmon Rice Bowl',
  items: [
    { name: "Morey's Wild Alaskan Salmon", brand: "Morey's", amount: '1 fillet (170g)', cal: 260, protein: 33, sodium: 420, fiber: 1, carbs: 2 },
    { name: 'White Rice cooked', amount: '1.5 cups', cal: 300, protein: 6, sodium: 0, fiber: 0.9, carbs: 66 },
    { name: 'Kirkland Frozen Veggies', brand: 'Kirkland', amount: '1.5 cups', cal: 53, protein: 3, sodium: 23, fiber: 3, carbs: 14 },
    { name: 'Ghee', amount: '1 tsp (rice tadka)', cal: 42, protein: 0, sodium: 0, fiber: 0, carbs: 0 },
  ],
  totals: { cal: 655, protein: 42, sodium: 443, fiber: 4.9, carbs: 82 },
  notes: 'Tadka: heat ghee, splutter cumin, add turmeric + lemon, toss with rice. Flake salmon on top.',
}

// ── SUNDAY ───────────────────────────────────────────────────
const SUNDAY_MEALS: Meal = {
  id: 'sunday',
  name: 'Fairlife + Fruit Fast',
  items: [
    { name: 'Fairlife Core Power', brand: 'Fairlife', amount: '1 bottle', cal: 230, protein: 42, sodium: 280, fiber: 0, carbs: 12 },
    { name: 'Water', amount: 'unlimited', cal: 0, protein: 0, sodium: 0, fiber: 0, carbs: 0 },
    { name: 'Green Tea unsweetened', amount: 'as desired', cal: 0, protein: 0, sodium: 0, fiber: 0, carbs: 0 },
    { name: 'Watermelon (when hungry)', amount: '300-400g', cal: 100, protein: 1, sodium: 3, fiber: 1, carbs: 25 },
  ],
  totals: { cal: 330, protein: 43, sodium: 283, fiber: 1, carbs: 37 },
  notes: 'Intentional deficit day. Only eat fruit when genuinely hungry.',
}

// ── SWAP OPTIONS ─────────────────────────────────────────────
export const SWAP_OPTIONS: Record<string, Meal[]> = {
  wfh_dinner_rest: [SOYA_DINNER, CHANA_DINNER],
  wfh_dinner_gym: [SOYA_DINNER, CHANA_DINNER],
  office_dinner: [WFH_DINNER, SOYA_DINNER],
}

// ── DAY TEMPLATES ────────────────────────────────────────────
export const DAY_TEMPLATES: Record<DayType, DayTemplate> = {
  wfh_regular: {
    dayType: 'wfh_regular',
    label: 'WFH Regular',
    emoji: '🏠',
    description: 'Work from home with tuna masala',
    breakfast: BREAKFAST,
    lunch: TUNA_MASALA,
    shake: FAIRLIFE,
    dinner: WFH_DINNER,
    snack: WFH_SNACK_REST,
    targets: { cal: 1800, protein: 140, sodium: 1500, fiber: 25, carbs: 180 },
    gymNotes: 'Gym day: add rice to lunch, skip PB at dinner, 2 dates only for snack, add Vita Coco',
  },
  wfh_soya: {
    dayType: 'wfh_soya',
    label: 'WFH Soya',
    emoji: '🫘',
    description: 'Work from home with soya dinner',
    breakfast: BREAKFAST,
    lunch: TUNA_MASALA,
    shake: FAIRLIFE,
    dinner: SOYA_DINNER,
    snack: { ...WFH_SNACK_REST, items: [WFH_SNACK_REST.items[0], { ...WFH_SNACK_REST.items[1], amount: '1 medium', cal: 65, carbs: 15 }], totals: { cal: 109, protein: 1.6, sodium: 0, fiber: 4.6, carbs: 27 } },
    targets: { cal: 1800, protein: 140, sodium: 1500, fiber: 25, carbs: 200 },
  },
  wfh_chana: {
    dayType: 'wfh_chana',
    label: 'WFH Chana Dal',
    emoji: '🍲',
    description: 'Work from home with chana dal dinner',
    breakfast: BREAKFAST,
    lunch: TUNA_MASALA,
    shake: FAIRLIFE,
    dinner: CHANA_DINNER,
    snack: { ...WFH_SNACK_REST, items: [WFH_SNACK_REST.items[0], { ...WFH_SNACK_REST.items[1], amount: '1 medium', cal: 65, carbs: 15 }], totals: { cal: 109, protein: 1.6, sodium: 0, fiber: 4.6, carbs: 27 } },
    targets: { cal: 1800, protein: 140, sodium: 1500, fiber: 25, carbs: 200 },
  },
  wfh_chipotle: {
    dayType: 'wfh_chipotle',
    label: 'WFH Chipotle',
    emoji: '🌯',
    description: 'Chipotle for lunch — no Fairlife today',
    breakfast: BREAKFAST,
    lunch: CHIPOTLE_LUNCH,
    dinner: CHIPOTLE_DINNER,
    snack: { ...WFH_SNACK_REST, items: [WFH_SNACK_REST.items[0], { ...WFH_SNACK_REST.items[1], amount: '1 medium', cal: 65, carbs: 15 }], totals: { cal: 109, protein: 1.6, sodium: 0, fiber: 4.6, carbs: 27 } },
    targets: { cal: 1800, protein: 140, sodium: 1500, fiber: 25, carbs: 150 },
    gymNotes: '⚠️ Sodium is at ceiling. No swaps, no extras tonight.',
  },
  office: {
    dayType: 'office',
    label: 'Office Day',
    emoji: '🏢',
    description: 'Office day with salad + salmon',
    breakfast: BREAKFAST,
    lunch: OFFICE_LUNCH,
    shake: FAIRLIFE,
    dinner: OFFICE_DINNER,
    targets: { cal: 1800, protein: 140, sodium: 1500, fiber: 25, carbs: 150 },
    gymNotes: 'Gym day: Fairlife post-gym. No snack needed — calories are at target.',
  },
  sunday_fast: {
    dayType: 'sunday_fast',
    label: 'Sunday Fast',
    emoji: '🍉',
    description: 'Fruit fasting day — intentional deficit',
    breakfast: SUNDAY_MEALS,
    lunch: SUNDAY_MEALS,
    dinner: SUNDAY_MEALS,
    targets: { cal: 400, protein: 42, sodium: 300, fiber: 2, carbs: 40 },
  },
}

export const DAY_TYPE_OPTIONS: { value: DayType; label: string; emoji: string; description: string }[] = [
  { value: 'wfh_regular', label: 'WFH Regular', emoji: '🏠', description: 'Tuna masala lunch' },
  { value: 'wfh_soya', label: 'WFH Soya', emoji: '🫘', description: 'Soya chunks dinner' },
  { value: 'wfh_chana', label: 'WFH Chana Dal', emoji: '🍲', description: 'Chana dal dinner' },
  { value: 'wfh_chipotle', label: 'WFH Chipotle', emoji: '🌯', description: 'Chipotle for lunch' },
  { value: 'office', label: 'Office Day', emoji: '🏢', description: 'Salad + salmon' },
  { value: 'sunday_fast', label: 'Sunday Fast', emoji: '🍉', description: 'Fairlife + fruit only' },
]

export function getDayMeals(dayType: DayType, gymDay: boolean) {
  const template = DAY_TEMPLATES[dayType]
  return {
    breakfast: template.breakfast,
    lunch: gymDay && dayType === 'wfh_regular' ? TUNA_MASALA_GYM : template.lunch,
    shake: dayType !== 'wfh_chipotle' && dayType !== 'sunday_fast' ? template.shake : undefined,
    vitaCoco: gymDay ? VITA_COCO : undefined,
    dinner: gymDay && dayType === 'wfh_regular' ? WFH_DINNER_GYM : template.dinner,
    snack: gymDay && (dayType === 'wfh_regular' || dayType === 'wfh_soya' || dayType === 'wfh_chana') ? WFH_SNACK_GYM : template.snack,
  }
}

export function calcAdjustedTotals(meal: Meal, multipliers: Record<number, number>): Macro {
  return meal.items.reduce((acc, item, i) => {
    const m = multipliers[i] ?? 1
    return {
      cal: acc.cal + item.cal * m,
      protein: acc.protein + item.protein * m,
      sodium: acc.sodium + item.sodium * m,
      fiber: acc.fiber + item.fiber * m,
      carbs: acc.carbs + item.carbs * m,
    }
  }, { cal: 0, protein: 0, sodium: 0, fiber: 0, carbs: 0 })
}

export function calculateDayTotals(dayType: DayType, gymDay: boolean): Macro {
  const meals = getDayMeals(dayType, gymDay)
  const allMeals = [meals.breakfast, meals.lunch, meals.shake, meals.vitaCoco, meals.dinner, meals.snack].filter(Boolean) as Meal[]
  
  return allMeals.reduce((acc, meal) => ({
    cal: acc.cal + meal.totals.cal,
    protein: acc.protein + meal.totals.protein,
    sodium: acc.sodium + meal.totals.sodium,
    fiber: acc.fiber + meal.totals.fiber,
    carbs: acc.carbs + meal.totals.carbs,
  }), { cal: 0, protein: 0, sodium: 0, fiber: 0, carbs: 0 })
}

export const TARGETS: Macro = {
  cal: 1800,
  protein: 140,
  sodium: 1500,
  fiber: 25,
  carbs: 175,
}
