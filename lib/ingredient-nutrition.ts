export interface IngredientNutrition {
  id: string
  name: string
  aliases: string[]
  cuisine: string
  cal: number
  protein: number
  sodium: number
  carbs: number
  fiber: number
}

export const INGREDIENTS: IngredientNutrition[] = [
  { id: 'chicken-breast-raw', name: 'Chicken breast, raw', aliases: ['chicken', 'boneless chicken'], cuisine: 'General', cal: 120, protein: 22.5, sodium: 45, carbs: 0, fiber: 0 },
  { id: 'chicken-thigh-raw', name: 'Chicken thigh, raw', aliases: ['chicken thigh'], cuisine: 'General', cal: 177, protein: 17.7, sodium: 81, carbs: 0, fiber: 0 },
  { id: 'egg-whole', name: 'Egg, whole', aliases: ['egg'], cuisine: 'General', cal: 143, protein: 12.6, sodium: 142, carbs: 0.7, fiber: 0 },
  { id: 'onion-raw', name: 'Onion, raw', aliases: ['onion', 'pyaz'], cuisine: 'General', cal: 40, protein: 1.1, sodium: 4, carbs: 9.3, fiber: 1.7 },
  { id: 'tomato-raw', name: 'Tomato, raw', aliases: ['tomato', 'tamatar'], cuisine: 'General', cal: 18, protein: 0.9, sodium: 5, carbs: 3.9, fiber: 1.2 },
  { id: 'garlic-raw', name: 'Garlic, raw', aliases: ['garlic'], cuisine: 'General', cal: 149, protein: 6.4, sodium: 17, carbs: 33.1, fiber: 2.1 },
  { id: 'ginger-raw', name: 'Ginger, raw', aliases: ['ginger'], cuisine: 'General', cal: 80, protein: 1.8, sodium: 13, carbs: 17.8, fiber: 2 },
  { id: 'cilantro', name: 'Cilantro / coriander leaves', aliases: ['cilantro', 'coriander leaves', 'dhaniya'], cuisine: 'General', cal: 23, protein: 2.1, sodium: 46, carbs: 3.7, fiber: 2.8 },
  { id: 'lemon-juice', name: 'Lemon juice', aliases: ['lemon', 'lime'], cuisine: 'General', cal: 22, protein: 0.4, sodium: 1, carbs: 6.9, fiber: 0.3 },
  { id: 'oil-canola', name: 'Canola / neutral oil', aliases: ['oil', 'canola oil', 'vegetable oil'], cuisine: 'General', cal: 884, protein: 0, sodium: 0, carbs: 0, fiber: 0 },
  { id: 'olive-oil', name: 'Olive oil', aliases: ['olive oil'], cuisine: 'Mediterranean', cal: 884, protein: 0, sodium: 2, carbs: 0, fiber: 0 },
  { id: 'ghee', name: 'Ghee', aliases: ['ghee'], cuisine: 'Indian', cal: 900, protein: 0, sodium: 0, carbs: 0, fiber: 0 },
  { id: 'yogurt-plain-lowfat', name: 'Plain low-fat yogurt', aliases: ['yogurt', 'curd', 'dahi'], cuisine: 'Indian', cal: 63, protein: 5.3, sodium: 70, carbs: 7, fiber: 0 },
  { id: 'coconut-milk', name: 'Coconut milk, canned', aliases: ['coconut milk'], cuisine: 'Thai', cal: 197, protein: 2, sodium: 13, carbs: 2.8, fiber: 0 },
  { id: 'rice-white-cooked', name: 'White rice, cooked', aliases: ['rice', 'white rice', 'chawal'], cuisine: 'Asian', cal: 130, protein: 2.7, sodium: 1, carbs: 28.2, fiber: 0.4 },
  { id: 'rice-brown-cooked', name: 'Brown rice, cooked', aliases: ['brown rice'], cuisine: 'Asian', cal: 123, protein: 2.7, sodium: 4, carbs: 25.6, fiber: 1.6 },
  { id: 'basmati-cooked', name: 'Basmati rice, cooked', aliases: ['basmati'], cuisine: 'Indian', cal: 121, protein: 3.5, sodium: 1, carbs: 25.2, fiber: 0.4 },
  { id: 'roti', name: 'Roti / chapati', aliases: ['roti', 'chapati'], cuisine: 'Indian', cal: 300, protein: 9, sodium: 300, carbs: 46, fiber: 6 },
  { id: 'lentils-cooked', name: 'Lentils, cooked', aliases: ['lentils', 'dal', 'masoor'], cuisine: 'Indian', cal: 116, protein: 9, sodium: 2, carbs: 20.1, fiber: 7.9 },
  { id: 'chickpeas-cooked', name: 'Chickpeas, cooked', aliases: ['chickpeas', 'chana', 'garbanzo'], cuisine: 'Indian / Middle Eastern', cal: 164, protein: 8.9, sodium: 7, carbs: 27.4, fiber: 7.6 },
  { id: 'kidney-beans-cooked', name: 'Kidney beans, cooked', aliases: ['rajma', 'kidney beans'], cuisine: 'Indian / Mexican', cal: 127, protein: 8.7, sodium: 1, carbs: 22.8, fiber: 6.4 },
  { id: 'black-beans-cooked', name: 'Black beans, cooked', aliases: ['black beans'], cuisine: 'Mexican', cal: 132, protein: 8.9, sodium: 1, carbs: 23.7, fiber: 8.7 },
  { id: 'corn-tortilla', name: 'Corn tortilla', aliases: ['corn tortilla', 'tortilla'], cuisine: 'Mexican', cal: 218, protein: 5.7, sodium: 45, carbs: 44.6, fiber: 6.3 },
  { id: 'flour-tortilla', name: 'Flour tortilla', aliases: ['flour tortilla'], cuisine: 'Mexican', cal: 304, protein: 8.2, sodium: 736, carbs: 49.3, fiber: 3.3 },
  { id: 'avocado', name: 'Avocado', aliases: ['avocado'], cuisine: 'Mexican', cal: 160, protein: 2, sodium: 7, carbs: 8.5, fiber: 6.7 },
  { id: 'salsa', name: 'Salsa', aliases: ['salsa'], cuisine: 'Mexican', cal: 36, protein: 1.5, sodium: 430, carbs: 7, fiber: 1.5 },
  { id: 'hummus', name: 'Hummus', aliases: ['hummus'], cuisine: 'Middle Eastern', cal: 166, protein: 7.9, sodium: 379, carbs: 14.3, fiber: 6 },
  { id: 'tahini', name: 'Tahini', aliases: ['tahini'], cuisine: 'Middle Eastern', cal: 595, protein: 17, sodium: 115, carbs: 21, fiber: 9.3 },
  { id: 'pita', name: 'Pita bread', aliases: ['pita'], cuisine: 'Middle Eastern', cal: 275, protein: 9.1, sodium: 536, carbs: 55.7, fiber: 2.2 },
  { id: 'tofu-firm', name: 'Firm tofu', aliases: ['tofu'], cuisine: 'Japanese / Thai', cal: 144, protein: 17.3, sodium: 14, carbs: 2.8, fiber: 2.3 },
  { id: 'soy-sauce', name: 'Soy sauce', aliases: ['soy sauce'], cuisine: 'Japanese', cal: 53, protein: 8.1, sodium: 5493, carbs: 4.9, fiber: 0.8 },
  { id: 'miso', name: 'Miso paste', aliases: ['miso'], cuisine: 'Japanese', cal: 198, protein: 12.8, sodium: 3728, carbs: 25.4, fiber: 5.4 },
  { id: 'sushi-rice-cooked', name: 'Sushi rice, cooked', aliases: ['sushi rice'], cuisine: 'Japanese', cal: 143, protein: 2.4, sodium: 200, carbs: 31.9, fiber: 0.3 },
  { id: 'edamame', name: 'Edamame, cooked', aliases: ['edamame'], cuisine: 'Japanese', cal: 122, protein: 11.9, sodium: 6, carbs: 8.9, fiber: 5.2 },
  { id: 'thai-curry-paste', name: 'Thai curry paste', aliases: ['thai curry paste', 'red curry paste', 'green curry paste'], cuisine: 'Thai', cal: 133, protein: 3.3, sodium: 4000, carbs: 20, fiber: 6.7 },
  { id: 'fish-sauce', name: 'Fish sauce', aliases: ['fish sauce'], cuisine: 'Thai', cal: 35, protein: 5, sodium: 7851, carbs: 3.6, fiber: 0 },
  { id: 'peanut-butter', name: 'Peanut butter', aliases: ['peanut butter'], cuisine: 'General', cal: 588, protein: 25, sodium: 459, carbs: 20, fiber: 6 },
  { id: 'potato', name: 'Potato, raw', aliases: ['potato', 'aloo'], cuisine: 'General', cal: 77, protein: 2, sodium: 6, carbs: 17.5, fiber: 2.2 },
  { id: 'spinach', name: 'Spinach, raw', aliases: ['spinach', 'palak'], cuisine: 'General', cal: 23, protein: 2.9, sodium: 79, carbs: 3.6, fiber: 2.2 },
]

export function searchIngredients(query: string) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return INGREDIENTS.slice(0, 10)

  return INGREDIENTS
    .map((ingredient) => {
      const searchable = [ingredient.name, ingredient.cuisine, ...ingredient.aliases].join(' ').toLowerCase()
      const starts = ingredient.name.toLowerCase().startsWith(normalized) ? 2 : 0
      const includes = searchable.includes(normalized) ? 1 : 0
      return { ingredient, score: starts + includes }
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.ingredient.name.localeCompare(b.ingredient.name))
    .slice(0, 12)
    .map(({ ingredient }) => ingredient)
}
