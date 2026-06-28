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
  { id: 'beef-ground-90', name: 'Ground beef, 90% lean, raw', aliases: ['beef', 'ground beef', 'keema'], cuisine: 'Global', cal: 176, protein: 20, sodium: 66, carbs: 0, fiber: 0 },
  { id: 'beef-chuck-raw', name: 'Beef chuck, raw', aliases: ['beef chuck', 'stew beef'], cuisine: 'Global', cal: 180, protein: 19.6, sodium: 66, carbs: 0, fiber: 0 },
  { id: 'lamb-raw', name: 'Lamb, raw', aliases: ['lamb', 'mutton'], cuisine: 'Middle Eastern / Indian / Global', cal: 234, protein: 17.9, sodium: 72, carbs: 0, fiber: 0 },
  { id: 'pork-loin-raw', name: 'Pork loin, raw', aliases: ['pork', 'pork loin'], cuisine: 'Global', cal: 143, protein: 21.4, sodium: 53, carbs: 0, fiber: 0 },
  { id: 'turkey-breast-raw', name: 'Turkey breast, raw', aliases: ['turkey'], cuisine: 'Global', cal: 114, protein: 23.7, sodium: 46, carbs: 0, fiber: 0 },
  { id: 'salmon-raw', name: 'Salmon, raw', aliases: ['salmon'], cuisine: 'Global / Japanese', cal: 208, protein: 20.4, sodium: 59, carbs: 0, fiber: 0 },
  { id: 'tuna-raw', name: 'Tuna, raw', aliases: ['tuna'], cuisine: 'Global / Japanese', cal: 109, protein: 24.4, sodium: 45, carbs: 0, fiber: 0 },
  { id: 'cod-raw', name: 'Cod, raw', aliases: ['cod', 'white fish'], cuisine: 'Global', cal: 82, protein: 17.8, sodium: 54, carbs: 0, fiber: 0 },
  { id: 'shrimp-raw', name: 'Shrimp, raw', aliases: ['shrimp', 'prawn'], cuisine: 'Global / Thai / Latin', cal: 85, protein: 20.1, sodium: 119, carbs: 0.2, fiber: 0 },
  { id: 'paneer', name: 'Paneer', aliases: ['paneer'], cuisine: 'Indian', cal: 321, protein: 18.3, sodium: 18, carbs: 3.6, fiber: 0 },
  { id: 'tempeh', name: 'Tempeh', aliases: ['tempeh'], cuisine: 'Indonesian', cal: 193, protein: 20.3, sodium: 9, carbs: 7.6, fiber: 0 },
  { id: 'seitan', name: 'Seitan', aliases: ['seitan', 'wheat gluten'], cuisine: 'Global vegetarian', cal: 370, protein: 75, sodium: 29, carbs: 14, fiber: 1 },
  { id: 'milk-whole', name: 'Whole milk', aliases: ['milk'], cuisine: 'Global', cal: 61, protein: 3.2, sodium: 43, carbs: 4.8, fiber: 0 },
  { id: 'cream-heavy', name: 'Heavy cream', aliases: ['cream', 'heavy cream'], cuisine: 'Global', cal: 340, protein: 2.8, sodium: 27, carbs: 2.8, fiber: 0 },
  { id: 'butter', name: 'Butter', aliases: ['butter'], cuisine: 'Global', cal: 717, protein: 0.9, sodium: 11, carbs: 0.1, fiber: 0 },
  { id: 'feta', name: 'Feta cheese', aliases: ['feta'], cuisine: 'Greek / Mediterranean', cal: 264, protein: 14.2, sodium: 1116, carbs: 4.1, fiber: 0 },
  { id: 'mozzarella', name: 'Mozzarella cheese', aliases: ['mozzarella'], cuisine: 'Italian', cal: 280, protein: 28, sodium: 627, carbs: 3.1, fiber: 0 },
  { id: 'parmesan', name: 'Parmesan cheese', aliases: ['parmesan'], cuisine: 'Italian', cal: 431, protein: 38, sodium: 1529, carbs: 4.1, fiber: 0 },
  { id: 'pasta-cooked', name: 'Pasta, cooked', aliases: ['pasta', 'spaghetti', 'macaroni'], cuisine: 'Italian / Global', cal: 158, protein: 5.8, sodium: 1, carbs: 30.9, fiber: 1.8 },
  { id: 'egg-noodles-cooked', name: 'Egg noodles, cooked', aliases: ['egg noodles', 'noodles'], cuisine: 'East Asian / European', cal: 138, protein: 4.5, sodium: 5, carbs: 25.2, fiber: 1.2 },
  { id: 'rice-noodles-cooked', name: 'Rice noodles, cooked', aliases: ['rice noodles', 'pad thai noodles'], cuisine: 'Thai / Vietnamese', cal: 108, protein: 1.8, sodium: 19, carbs: 24.9, fiber: 1 },
  { id: 'quinoa-cooked', name: 'Quinoa, cooked', aliases: ['quinoa'], cuisine: 'Andean / Global', cal: 120, protein: 4.4, sodium: 7, carbs: 21.3, fiber: 2.8 },
  { id: 'couscous-cooked', name: 'Couscous, cooked', aliases: ['couscous'], cuisine: 'North African', cal: 112, protein: 3.8, sodium: 5, carbs: 23.2, fiber: 1.4 },
  { id: 'bulgur-cooked', name: 'Bulgur, cooked', aliases: ['bulgur'], cuisine: 'Middle Eastern / Turkish', cal: 83, protein: 3.1, sodium: 5, carbs: 18.6, fiber: 4.5 },
  { id: 'oats-dry', name: 'Oats, dry', aliases: ['oats', 'oatmeal'], cuisine: 'Global', cal: 389, protein: 16.9, sodium: 2, carbs: 66.3, fiber: 10.6 },
  { id: 'bread-white', name: 'White bread', aliases: ['bread'], cuisine: 'Global', cal: 265, protein: 9, sodium: 491, carbs: 49, fiber: 2.7 },
  { id: 'sourdough', name: 'Sourdough bread', aliases: ['sourdough'], cuisine: 'European / Global', cal: 289, protein: 11, sodium: 513, carbs: 56, fiber: 2.4 },
  { id: 'baguette', name: 'Baguette / French bread', aliases: ['baguette', 'french bread'], cuisine: 'French', cal: 274, protein: 10.7, sodium: 602, carbs: 52, fiber: 2.3 },
  { id: 'injera', name: 'Injera', aliases: ['injera'], cuisine: 'Ethiopian / Eritrean', cal: 131, protein: 4, sodium: 260, carbs: 26, fiber: 2.6 },
  { id: 'arepa', name: 'Arepa', aliases: ['arepa'], cuisine: 'Venezuelan / Colombian', cal: 219, protein: 5.5, sodium: 300, carbs: 45, fiber: 3.5 },
  { id: 'plantain-raw', name: 'Plantain, raw', aliases: ['plantain'], cuisine: 'Caribbean / African / Latin', cal: 122, protein: 1.3, sodium: 4, carbs: 31.9, fiber: 2.3 },
  { id: 'cassava-raw', name: 'Cassava / yuca, raw', aliases: ['cassava', 'yuca', 'manioc'], cuisine: 'African / Latin / Caribbean', cal: 160, protein: 1.4, sodium: 14, carbs: 38.1, fiber: 1.8 },
  { id: 'sweet-potato', name: 'Sweet potato, raw', aliases: ['sweet potato'], cuisine: 'Global', cal: 86, protein: 1.6, sodium: 55, carbs: 20.1, fiber: 3 },
  { id: 'carrot', name: 'Carrot, raw', aliases: ['carrot'], cuisine: 'Global', cal: 41, protein: 0.9, sodium: 69, carbs: 9.6, fiber: 2.8 },
  { id: 'bell-pepper', name: 'Bell pepper, raw', aliases: ['bell pepper', 'capsicum'], cuisine: 'Global', cal: 31, protein: 1, sodium: 4, carbs: 6, fiber: 2.1 },
  { id: 'broccoli', name: 'Broccoli, raw', aliases: ['broccoli'], cuisine: 'Global', cal: 34, protein: 2.8, sodium: 33, carbs: 6.6, fiber: 2.6 },
  { id: 'cauliflower', name: 'Cauliflower, raw', aliases: ['cauliflower', 'gobi'], cuisine: 'Global / Indian', cal: 25, protein: 1.9, sodium: 30, carbs: 5, fiber: 2 },
  { id: 'eggplant', name: 'Eggplant / aubergine, raw', aliases: ['eggplant', 'aubergine', 'brinjal', 'baingan'], cuisine: 'Mediterranean / Indian / Global', cal: 25, protein: 1, sodium: 2, carbs: 5.9, fiber: 3 },
  { id: 'zucchini', name: 'Zucchini, raw', aliases: ['zucchini', 'courgette'], cuisine: 'Mediterranean / Global', cal: 17, protein: 1.2, sodium: 8, carbs: 3.1, fiber: 1 },
  { id: 'cabbage', name: 'Cabbage, raw', aliases: ['cabbage'], cuisine: 'Global', cal: 25, protein: 1.3, sodium: 18, carbs: 5.8, fiber: 2.5 },
  { id: 'mushroom-white', name: 'White mushrooms, raw', aliases: ['mushroom', 'mushrooms'], cuisine: 'Global', cal: 22, protein: 3.1, sodium: 5, carbs: 3.3, fiber: 1 },
  { id: 'cucumber', name: 'Cucumber, raw', aliases: ['cucumber'], cuisine: 'Global', cal: 15, protein: 0.7, sodium: 2, carbs: 3.6, fiber: 0.5 },
  { id: 'lettuce-romaine', name: 'Romaine lettuce', aliases: ['lettuce', 'romaine'], cuisine: 'Global', cal: 17, protein: 1.2, sodium: 8, carbs: 3.3, fiber: 2.1 },
  { id: 'bok-choy', name: 'Bok choy, raw', aliases: ['bok choy', 'pak choi'], cuisine: 'Chinese / East Asian', cal: 13, protein: 1.5, sodium: 65, carbs: 2.2, fiber: 1 },
  { id: 'kimchi', name: 'Kimchi', aliases: ['kimchi'], cuisine: 'Korean', cal: 15, protein: 1.1, sodium: 498, carbs: 2.4, fiber: 1.6 },
  { id: 'gochujang', name: 'Gochujang', aliases: ['gochujang'], cuisine: 'Korean', cal: 220, protein: 4, sodium: 3500, carbs: 44, fiber: 2 },
  { id: 'sesame-oil', name: 'Sesame oil', aliases: ['sesame oil'], cuisine: 'East Asian / Global', cal: 884, protein: 0, sodium: 0, carbs: 0, fiber: 0 },
  { id: 'hoisin-sauce', name: 'Hoisin sauce', aliases: ['hoisin'], cuisine: 'Chinese', cal: 220, protein: 3.3, sodium: 1615, carbs: 44, fiber: 1.7 },
  { id: 'oyster-sauce', name: 'Oyster sauce', aliases: ['oyster sauce'], cuisine: 'Chinese / Thai', cal: 51, protein: 1.4, sodium: 2733, carbs: 10.9, fiber: 0 },
  { id: 'teriyaki-sauce', name: 'Teriyaki sauce', aliases: ['teriyaki'], cuisine: 'Japanese', cal: 89, protein: 5.9, sodium: 3833, carbs: 15.6, fiber: 0.3 },
  { id: 'mirin', name: 'Mirin', aliases: ['mirin'], cuisine: 'Japanese', cal: 241, protein: 0.2, sodium: 14, carbs: 43.2, fiber: 0 },
  { id: 'sake', name: 'Sake', aliases: ['sake'], cuisine: 'Japanese', cal: 134, protein: 0.5, sodium: 2, carbs: 5, fiber: 0 },
  { id: 'harissa', name: 'Harissa paste', aliases: ['harissa'], cuisine: 'North African', cal: 225, protein: 3, sodium: 1400, carbs: 13, fiber: 5 },
  { id: 'berbere', name: 'Berbere spice blend', aliases: ['berbere'], cuisine: 'Ethiopian / Eritrean', cal: 250, protein: 12, sodium: 60, carbs: 50, fiber: 20 },
  { id: 'tomato-paste', name: 'Tomato paste', aliases: ['tomato paste'], cuisine: 'Global', cal: 82, protein: 4.3, sodium: 59, carbs: 18.9, fiber: 4.1 },
  { id: 'pesto', name: 'Pesto', aliases: ['pesto'], cuisine: 'Italian', cal: 418, protein: 4.9, sodium: 870, carbs: 6, fiber: 1.6 },
  { id: 'marinara', name: 'Marinara sauce', aliases: ['marinara', 'pasta sauce'], cuisine: 'Italian', cal: 54, protein: 1.5, sodium: 400, carbs: 8, fiber: 1.8 },
  { id: 'sauerkraut', name: 'Sauerkraut', aliases: ['sauerkraut'], cuisine: 'Central / Eastern European', cal: 19, protein: 0.9, sodium: 661, carbs: 4.3, fiber: 2.9 },
  { id: 'mayonnaise', name: 'Mayonnaise', aliases: ['mayo', 'mayonnaise'], cuisine: 'Global', cal: 680, protein: 1, sodium: 635, carbs: 0.6, fiber: 0 },
  { id: 'mustard', name: 'Mustard', aliases: ['mustard'], cuisine: 'Global', cal: 66, protein: 4.4, sodium: 1135, carbs: 5.8, fiber: 4 },
  { id: 'almonds', name: 'Almonds', aliases: ['almonds', 'badam'], cuisine: 'Global', cal: 579, protein: 21.2, sodium: 1, carbs: 21.6, fiber: 12.5 },
  { id: 'cashews', name: 'Cashews', aliases: ['cashews', 'kaju'], cuisine: 'Global / Indian', cal: 553, protein: 18.2, sodium: 12, carbs: 30.2, fiber: 3.3 },
  { id: 'walnuts', name: 'Walnuts', aliases: ['walnuts'], cuisine: 'Global', cal: 654, protein: 15.2, sodium: 2, carbs: 13.7, fiber: 6.7 },
  { id: 'sesame-seeds', name: 'Sesame seeds', aliases: ['sesame', 'til'], cuisine: 'Global / Middle Eastern / Asian', cal: 573, protein: 17.7, sodium: 11, carbs: 23.4, fiber: 11.8 },
  { id: 'pumpkin-seeds', name: 'Pumpkin seeds', aliases: ['pumpkin seeds', 'pepitas'], cuisine: 'Global / Mexican', cal: 559, protein: 30.2, sodium: 7, carbs: 10.7, fiber: 6 },
  { id: 'banana-raw', name: 'Banana', aliases: ['banana'], cuisine: 'Global', cal: 89, protein: 1.1, sodium: 1, carbs: 22.8, fiber: 2.6 },
  { id: 'apple-raw', name: 'Apple', aliases: ['apple'], cuisine: 'Global', cal: 52, protein: 0.3, sodium: 1, carbs: 13.8, fiber: 2.4 },
  { id: 'mango-raw', name: 'Mango', aliases: ['mango', 'aam'], cuisine: 'South Asian / Latin / Global', cal: 60, protein: 0.8, sodium: 1, carbs: 15, fiber: 1.6 },
  { id: 'dates', name: 'Dates', aliases: ['dates', 'khajoor'], cuisine: 'Middle Eastern / Global', cal: 282, protein: 2.5, sodium: 2, carbs: 75, fiber: 8 },
  { id: 'raisins', name: 'Raisins', aliases: ['raisins', 'kishmish'], cuisine: 'Global', cal: 299, protein: 3.1, sodium: 11, carbs: 79.2, fiber: 3.7 },
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
