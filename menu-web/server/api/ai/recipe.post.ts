/**
 * POST /api/ai/recipe
 *
 * Genera una receta simulada a partir de ingredientes proporcionados,
 * usando lógica de reglas nutricionales (sin API externa de IA).
 *
 * Body esperado:
 * {
 *   ingredients: Array<{ name: string; quantity_g?: number; category?: string }>;
 *   preferences?: { maxKcal?: number; mealType?: "desayuno" | "comida" | "cena" | "snack" };
 * }
 *
 * Devuelve una receta con nombre, pasos, ingredientes ajustados y totales nutricionales.
 */

type RecipeIngredientInput = {
  name: string;
  quantity_g?: number;
  category?: string;
};

type RecipePreferences = {
  maxKcal?: number;
  mealType?: "desayuno" | "comida" | "cena" | "snack";
};

type RecipeRequestBody = {
  ingredients: RecipeIngredientInput[];
  preferences?: RecipePreferences;
};

// Base nutricional por 100g para ingredientes comunes
const NUTRITION_DB: Record<string, { kcal: number; protein: number; carbs: number; fat: number }> = {
  // Proteínas
  pollo: { kcal: 165, protein: 31, carbs: 0, fat: 3.6 },
  "pechuga de pollo": { kcal: 165, protein: 31, carbs: 0, fat: 3.6 },
  ternera: { kcal: 250, protein: 26, carbs: 0, fat: 17 },
  cerdo: { kcal: 242, protein: 27, carbs: 0, fat: 14 },
  pescado: { kcal: 206, protein: 22, carbs: 0, fat: 13 },
  salmón: { kcal: 208, protein: 20, carbs: 0, fat: 14 },
  atún: { kcal: 132, protein: 29, carbs: 0, fat: 1 },
  merluza: { kcal: 90, protein: 18, carbs: 0, fat: 1.8 },
  huevos: { kcal: 155, protein: 13, carbs: 1.1, fat: 11 },
  huevo: { kcal: 155, protein: 13, carbs: 1.1, fat: 11 },
  gambas: { kcal: 99, protein: 24, carbs: 0.2, fat: 0.3 },
  tofu: { kcal: 76, protein: 8, carbs: 1.9, fat: 4.8 },
  lentejas: { kcal: 116, protein: 9, carbs: 20, fat: 0.4 },
  garbanzos: { kcal: 139, protein: 8.9, carbs: 23, fat: 2.6 },
  judías: { kcal: 127, protein: 8.7, carbs: 22.8, fat: 0.5 },
  alubias: { kcal: 127, protein: 8.7, carbs: 22.8, fat: 0.5 },

  // Verduras
  tomate: { kcal: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  cebolla: { kcal: 40, protein: 1.1, carbs: 9, fat: 0.1 },
  ajo: { kcal: 149, protein: 6.4, carbs: 33, fat: 0.5 },
  pimiento: { kcal: 31, protein: 1, carbs: 6, fat: 0.3 },
  "pimiento rojo": { kcal: 31, protein: 1, carbs: 6, fat: 0.3 },
  "pimiento verde": { kcal: 20, protein: 0.9, carbs: 4.6, fat: 0.2 },
  zanahoria: { kcal: 41, protein: 0.9, carbs: 9.6, fat: 0.2 },
  calabacín: { kcal: 17, protein: 1.2, carbs: 3.1, fat: 0.3 },
  berenjena: { kcal: 25, protein: 1, carbs: 5.9, fat: 0.2 },
  espinacas: { kcal: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
  acelgas: { kcal: 19, protein: 1.8, carbs: 3.7, fat: 0.2 },
  brócoli: { kcal: 34, protein: 2.8, carbs: 7, fat: 0.4 },
  coliflor: { kcal: 25, protein: 1.9, carbs: 5, fat: 0.3 },
  lechuga: { kcal: 15, protein: 1.4, carbs: 2.9, fat: 0.2 },
  pepino: { kcal: 15, protein: 0.7, carbs: 3.6, fat: 0.1 },
  champiñones: { kcal: 22, protein: 3.1, carbs: 3.3, fat: 0.3 },
  setas: { kcal: 22, protein: 3.1, carbs: 3.3, fat: 0.3 },

  // Carbohidratos
  arroz: { kcal: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  "arroz blanco": { kcal: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  "arroz integral": { kcal: 123, protein: 2.7, carbs: 25.6, fat: 0.9 },
  pasta: { kcal: 131, protein: 5, carbs: 25, fat: 0.7 },
  pan: { kcal: 265, protein: 9, carbs: 49, fat: 3.2 },
  "pan integral": { kcal: 247, protein: 13, carbs: 41, fat: 3.4 },
  patatas: { kcal: 77, protein: 2, carbs: 17, fat: 0.1 },
  patata: { kcal: 77, protein: 2, carbs: 17, fat: 0.1 },
  quinoa: { kcal: 120, protein: 4.4, carbs: 21, fat: 1.9 },
  couscous: { kcal: 112, protein: 3.8, carbs: 23, fat: 0.2 },
  avena: { kcal: 389, protein: 13, carbs: 66, fat: 6.9 },
  boniato: { kcal: 86, protein: 1.6, carbs: 20, fat: 0.1 },

  // Grasas / extras
  "aceite de oliva": { kcal: 884, protein: 0, carbs: 0, fat: 100 },
  aceite: { kcal: 884, protein: 0, carbs: 0, fat: 100 },
  mantequilla: { kcal: 717, protein: 0.9, carbs: 0.1, fat: 81 },
  queso: { kcal: 402, protein: 25, carbs: 1.3, fat: 33 },
  "queso rallado": { kcal: 402, protein: 25, carbs: 1.3, fat: 33 },
  mozzarella: { kcal: 280, protein: 22, carbs: 2.2, fat: 20 },
  leche: { kcal: 42, protein: 3.4, carbs: 5, fat: 1 },
  yogur: { kcal: 61, protein: 3.5, carbs: 4.7, fat: 3.3 },
  "nata líquida": { kcal: 270, protein: 2.5, carbs: 3, fat: 27 },
  nata: { kcal: 270, protein: 2.5, carbs: 3, fat: 27 },
  frutos_secos: { kcal: 580, protein: 20, carbs: 20, fat: 50 },
  almendras: { kcal: 579, protein: 21, carbs: 22, fat: 50 },
  nueces: { kcal: 654, protein: 15, carbs: 14, fat: 65 },

  // Frutas
  manzana: { kcal: 52, protein: 0.3, carbs: 14, fat: 0.2 },
  plátano: { kcal: 89, protein: 1.1, carbs: 23, fat: 0.3 },
  naranja: { kcal: 47, protein: 0.9, carbs: 12, fat: 0.1 },
  pera: { kcal: 57, protein: 0.4, carbs: 15, fat: 0.1 },
  fresas: { kcal: 32, protein: 0.7, carbs: 7.7, fat: 0.3 },
  uvas: { kcal: 69, protein: 0.7, carbs: 18, fat: 0.2 },
  kiwi: { kcal: 61, protein: 1.1, carbs: 15, fat: 0.5 },
  piña: { kcal: 50, protein: 0.5, carbs: 13, fat: 0.1 },
  mango: { kcal: 60, protein: 0.8, carbs: 15, fat: 0.4 },
  melocotón: { kcal: 39, protein: 0.9, carbs: 9.5, fat: 0.3 },
  melón: { kcal: 34, protein: 0.8, carbs: 8.2, fat: 0.2 },
  sandía: { kcal: 30, protein: 0.6, carbs: 7.6, fat: 0.2 },
  aguacate: { kcal: 160, protein: 2, carbs: 9, fat: 15 },

  // Salsas / condimentos
  tomate_frito: { kcal: 74, protein: 1.5, carbs: 13, fat: 1.5 },
  "salsa de tomate": { kcal: 74, protein: 1.5, carbs: 13, fat: 1.5 },
  mayonesa: { kcal: 680, protein: 1, carbs: 3, fat: 72 },
  mostaza: { kcal: 66, protein: 4.4, carbs: 6, fat: 3.6 },
  "salsa de soja": { kcal: 53, protein: 8.1, carbs: 5.6, fat: 0.1 },
  soja: { kcal: 53, protein: 8.1, carbs: 5.6, fat: 0.1 },
  vinagre: { kcal: 18, protein: 0.2, carbs: 0.9, fat: 0 },
  "caldo de pollo": { kcal: 6, protein: 0.6, carbs: 0.4, fat: 0.2 },
  caldo: { kcal: 6, protein: 0.6, carbs: 0.4, fat: 0.2 },
  azúcar: { kcal: 387, protein: 0, carbs: 100, fat: 0 },
  sal: { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  pimienta: { kcal: 251, protein: 10, carbs: 64, fat: 3.3 },
  orégano: { kcal: 265, protein: 9, carbs: 69, fat: 4.3 },
  perejil: { kcal: 36, protein: 2.9, carbs: 6.3, fat: 0.8 },
  cilantro: { kcal: 23, protein: 2.1, carbs: 3.7, fat: 0.5 },
  comino: { kcal: 375, protein: 18, carbs: 44, fat: 22 },
  "pimentón dulce": { kcal: 282, protein: 14, carbs: 54, fat: 13 },
  pimentón: { kcal: 282, protein: 14, carbs: 54, fat: 13 },
};

const NORMALIZE = (name: string): string =>
  name
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .replace(/[.,;:!¡¿?()]/g, "");

const round2 = (n: number): number => Math.round(n * 100) / 100;

// Clasifica un ingrediente en una categoría si no se proporcionó
function classifyIngredient(name: string): string {
  const n = NORMALIZE(name);

  const proteins = [
    "pollo", "pechuga", "ternera", "cerdo", "pescado", "salmon", "atun",
    "merluza", "huevo", "gambas", "tofu", "lentejas", "garbanzos",
    "alubias", "judias",
  ];
  const veggies = [
    "tomate", "cebolla", "ajo", "pimiento", "zanahoria", "calabacin",
    "berenjena", "espinacas", "acelgas", "brocoli", "coliflor", "lechuga",
    "pepino", "champi", "setas",
  ];
  const carbs = [
    "arroz", "pasta", "pan", "patata", "quinoa", "couscous", "avena",
    "boniato",
  ];
  const fats = [
    "aceite", "mantequilla", "queso", "mozzarella", "nata", "mayonesa",
    "frutos secos", "almendras", "nueces", "aguacate",
  ];
  const dairy = ["leche", "yogur"];
  const fruits = [
    "manzana", "platano", "naranja", "pera", "fresas", "uvas", "kiwi",
    "pina", "mango", "melon", "sandia", "melocoton",
  ];

  for (const kw of proteins) if (n.includes(kw)) return "proteina";
  for (const kw of veggies) if (n.includes(kw)) return "verdura";
  for (const kw of carbs) if (n.includes(kw)) return "carbohidrato";
  for (const kw of fats) if (n.includes(kw)) return "grasa";
  for (const kw of dairy) if (n.includes(kw)) return "lacteo";
  for (const kw of fruits) if (n.includes(kw)) return "fruta";
  return "otro";
}

// Busca info nutricional aproximada
function lookupNutrition(name: string): { kcal: number; protein: number; carbs: number; fat: number } | null {
  const n = NORMALIZE(name);
  // Búsqueda exacta
  if (NUTRITION_DB[n]) return NUTRITION_DB[n];
  // Búsqueda por subcadena
  for (const [key, value] of Object.entries(NUTRITION_DB)) {
    if (n.includes(key) || key.includes(n)) {
      return value;
    }
  }
  return null;
}

// Determina el tipo de comida predominante basado en las categorías
function determineMealType(categories: string[], preference?: string): "desayuno" | "comida" | "cena" | "snack" {
  if (preference && ["desayuno", "comida", "cena", "snack"].includes(preference)) {
    return preference as "desayuno" | "comida" | "cena" | "snack";
  }

  const count = (cat: string) => categories.filter((c) => c === cat).length;
  const hasProtein = count("proteina") > 0;
  const hasVeggie = count("verdura") > 0;
  const hasCarb = count("carbohidrato") > 0;
  const hasFruit = count("fruta") > 0;
  const hasDairy = count("lacteo") > 0;

  if (hasFruit && hasDairy && !hasProtein) return "desayuno";
  if (hasCarb && hasProtein && hasVeggie) return "comida";
  if (hasProtein && hasVeggie && !hasCarb) return "cena";
  if (hasFruit || (categories.length <= 2)) return "snack";
  return "comida";
}

// Genera un nombre de receta basado en los ingredientes principales
function generateRecipeName(ingredients: RecipeIngredientInput[], mealType: string): string {
  const mainIngredients = ingredients
    .filter((i) => {
      const cat = i.category || classifyIngredient(i.name);
      return cat === "proteina" || (cat === "carbohidrato" && ingredients.every((ing) => (ing.category || classifyIngredient(ing.name)) !== "proteina"));
    })
    .slice(0, 2);

  if (mainIngredients.length === 0) {
    const first = ingredients.slice(0, 2);
    return first.map((i) => i.name.charAt(0).toUpperCase() + i.name.slice(1)).join(" con ");
  }

  const names = mainIngredients.map((i) => i.name.charAt(0).toUpperCase() + i.name.slice(1));

  const prefixes: Record<string, string[]> = {
    desayuno: ["Tazón de", "Tostadas con", "Batido de", "Porridge de"],
    comida: ["Guiso de", "Salteado de", "Estofado de", "Arroz con", "Pasta con"],
    cena: ["Crema de", "Ensalada de", "Revuelto de", "Plancha de"],
    snack: ["Snack de", "Picoteo de", "Brochetas de"],
  };

  const prefix = prefixes[mealType]?.[Math.floor(Math.random() * prefixes[mealType].length)] || "Plato de";
  return `${prefix} ${names.join(" y ")}`;
}

// Genera los pasos de preparación
function generateSteps(
  ingredients: RecipeIngredientInput[],
  mealType: string,
): string[] {
  const categorized = ingredients.map((i) => ({
    ...i,
    category: i.category || classifyIngredient(i.name),
  }));

  const proteins = categorized.filter((i) => i.category === "proteina");
  const veggies = categorized.filter((i) => i.category === "verdura");
  const carbs = categorized.filter((i) => i.category === "carbohidrato");
  const fats = categorized.filter((i) => i.category === "grasa");
  const others = categorized.filter((i) => !["proteina", "verdura", "carbohidrato", "grasa"].includes(i.category));

  const steps: string[] = [];

  // Paso 1: preparación inicial
  const prepItems: string[] = [];
  if (veggies.length > 0) {
    prepItems.push(`lavar y cortar ${veggies.map((v) => v.name).join(", ")}`);
  }
  if (proteins.length > 0) {
    prepItems.push(`cortar ${proteins.map((p) => p.name).join(", ")} en trozos del tamaño deseado`);
  }
  if (prepItems.length > 0) {
    steps.push(`Preparar los ingredientes: ${prepItems.join("; ")}.`);
  }

  // Paso 2: cocción de proteínas
  if (proteins.length > 0) {
    const fatIngredient = fats.find((f) => NORMALIZE(f.name).includes("aceite"));
    if (mealType === "comida" || mealType === "cena") {
      if (fatIngredient) {
        steps.push(`Calentar ${fatIngredient.name} en una sartén grande a fuego medio. Dorar ${proteins.map((p) => p.name).join(" y ")} durante 5-8 minutos hasta que estén cocinados. Retirar y reservar.`);
      } else {
        steps.push(`Cocinar ${proteins.map((p) => p.name).join(" y ")} en una sartén antiadherente a fuego medio-alto durante 5-8 minutos hasta que estén bien hechos. Retirar y reservar.`);
      }
    }
  }

  // Paso 3: cocción de verduras
  if (veggies.length > 0) {
    const hardVeggies = veggies.filter((v) => {
      const n = NORMALIZE(v.name);
      return n.includes("cebolla") || n.includes("ajo") || n.includes("pimiento") || n.includes("zanahoria");
    });
    const softVeggies = veggies.filter((v) => !hardVeggies.includes(v));

    if (hardVeggies.length > 0) {
      if (fats.some((f) => NORMALIZE(f.name).includes("aceite")) || proteins.length === 0) {
        steps.push(`En la misma sartén, sofreír ${hardVeggies.map((v) => v.name).join(", ")} con un poco de aceite durante 5-7 minutos hasta que estén tiernos.`);
      }
    }

    if (softVeggies.length > 0) {
      steps.push(`Añadir ${softVeggies.map((v) => v.name).join(", ")} y cocinar 3-4 minutos más, removiendo ocasionalmente.`);
    }
  }

  // Paso 4: carbohidratos
  if (carbs.length > 0) {
    if (carbs.some((c) => NORMALIZE(c.name).includes("arroz") || NORMALIZE(c.name).includes("pasta") || NORMALIZE(c.name).includes("quinoa") || NORMALIZE(c.name).includes("couscous"))) {
      steps.push(`Cocer ${carbs.map((c) => c.name).join(" y ")} en agua con sal según las instrucciones del paquete. Escurrir y reservar.`);
    } else if (carbs.some((c) => NORMALIZE(c.name).includes("patata"))) {
      steps.push(`Pelar y cocer ${carbs.map((c) => c.name).join(" y ")} en agua con sal durante 15-20 minutos hasta que estén tiernas.`);
    } else {
      steps.push(`Preparar ${carbs.map((c) => c.name).join(" y ")} como acompañamiento.`);
    }
  }

  // Paso 5: combinación final
  if (mealType === "comida" && proteins.length > 0 && veggies.length > 0) {
    steps.push(`Reincorporar las proteínas reservadas a la sartén con las verduras. Mezclar bien y cocinar 2-3 minutos para integrar sabores.`);
  }

  // Paso 6: condimentos
  const seasonings = others.filter((o) => {
    const n = NORMALIZE(o.name);
    return n.includes("sal") || n.includes("pimienta") || n.includes("oregano") || n.includes("comino") || n.includes("pimenton") || n.includes("curry") || n.includes("perejil") || n.includes("cilantro");
  });
  if (seasonings.length > 0) {
    steps.push(`Sazonar con ${seasonings.map((s) => s.name).join(", ")} al gusto.`);
  } else {
    steps.push("Sazonar con sal y pimienta al gusto.");
  }

  // Paso 7: emplatado
  const servingSuggestions: Record<string, string> = {
    desayuno: "Servir inmediatamente en un bol o plato hondo.",
    comida: "Servir caliente acompañado de los carbohidratos preparados.",
    cena: "Emplatar y servir inmediatamente. Se puede acompañar con una ensalada ligera.",
    snack: "Servir en porciones individuales. Ideal para llevar.",
  };
  steps.push(servingSuggestions[mealType] || "Servir inmediatamente.");

  return steps;
}

// Estima tiempo de preparación en minutos basado en ingredientes y tipo de comida
function estimateCookingTime(
  ingredients: RecipeIngredientInput[],
  mealType: string,
): { prepTimeMin: number; cookTimeMin: number; totalTimeMin: number } {
  let prepTime = 10; // base
  let cookTime = 10;

  const categorized = ingredients.map((i) => ({
    ...i,
    category: i.category || classifyIngredient(i.name),
  }));

  const proteinCount = categorized.filter((i) => i.category === "proteina").length;
  const veggieCount = categorized.filter((i) => i.category === "verdura").length;
  const hasCarbs = categorized.some((i) => i.category === "carbohidrato");
  const hasRiceOrPasta = categorized.some((i) => {
    const n = NORMALIZE(i.name);
    return n.includes("arroz") || n.includes("pasta");
  });

  prepTime += veggieCount * 2;
  prepTime += proteinCount * 3;

  if (mealType === "comida") {
    cookTime += proteinCount * 8;
    cookTime += veggieCount * 3;
  } else if (mealType === "cena") {
    cookTime += proteinCount * 6;
    cookTime += veggieCount * 3;
  } else {
    cookTime += proteinCount * 5;
    cookTime += veggieCount * 2;
  }

  if (hasRiceOrPasta) cookTime += 12;
  else if (hasCarbs) cookTime += 8;

  return {
    prepTimeMin: prepTime,
    cookTimeMin: cookTime,
    totalTimeMin: prepTime + cookTime,
  };
}

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as RecipeRequestBody;

  if (!body.ingredients || !Array.isArray(body.ingredients) || body.ingredients.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Se requiere al menos un ingrediente en el array 'ingredients'",
    });
  }

  const ingredients = body.ingredients.map((ing) => ({
    name: ing.name.trim(),
    quantity_g: ing.quantity_g && ing.quantity_g > 0 ? ing.quantity_g : 150,
    category: ing.category || classifyIngredient(ing.name),
  }));

  // Cálculo nutricional total
  let totalKcal = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  const ingredientDetails: Array<{
    name: string;
    quantity_g: number;
    kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    category: string;
    has_nutrition_data: boolean;
  }> = [];

  for (const ing of ingredients) {
    const nutrition = lookupNutrition(ing.name);
    const factor = ing.quantity_g / 100;
    const kcal = nutrition ? round2(nutrition.kcal * factor) : 0;
    const protein = nutrition ? round2(nutrition.protein * factor) : 0;
    const carbs = nutrition ? round2(nutrition.carbs * factor) : 0;
    const fat = nutrition ? round2(nutrition.fat * factor) : 0;

    totalKcal += kcal;
    totalProtein += protein;
    totalCarbs += carbs;
    totalFat += fat;

    ingredientDetails.push({
      name: ing.name,
      quantity_g: ing.quantity_g,
      kcal,
      protein_g: protein,
      carbs_g: carbs,
      fat_g: fat,
      category: ing.category,
      has_nutrition_data: nutrition !== null,
    });
  }

  totalKcal = round2(totalKcal);
  totalProtein = round2(totalProtein);
  totalCarbs = round2(totalCarbs);
  totalFat = round2(totalFat);

  // Ajuste si hay un máximo de kcal
  let adjustedIngredients = ingredientDetails;
  const maxKcal = body.preferences?.maxKcal;
  let wasAdjusted = false;
  if (maxKcal && maxKcal > 0 && totalKcal > maxKcal) {
    const ratio = maxKcal / totalKcal;
    adjustedIngredients = ingredientDetails.map((ing) => ({
      ...ing,
      quantity_g: round2(ing.quantity_g * ratio),
      kcal: round2(ing.kcal * ratio),
      protein_g: round2(ing.protein_g * ratio),
      carbs_g: round2(ing.carbs_g * ratio),
      fat_g: round2(ing.fat_g * ratio),
    }));
    totalKcal = round2(totalKcal * ratio);
    totalProtein = round2(totalProtein * ratio);
    totalCarbs = round2(totalCarbs * ratio);
    totalFat = round2(totalFat * ratio);
    wasAdjusted = true;
  }

  const mealType = determineMealType(
    ingredients.map((i) => i.category),
    body.preferences?.mealType,
  );

  const recipeName = generateRecipeName(ingredients, mealType);
  const steps = generateSteps(ingredients, mealType);
  const timing = estimateCookingTime(ingredients, mealType);

  // Cálculo de distribución de macronutrientes
  const totalMacrosKcal = totalProtein * 4 + totalCarbs * 4 + totalFat * 9;
  const proteinPct = totalMacrosKcal > 0 ? round2((totalProtein * 4) / totalMacrosKcal * 100) : 0;
  const carbsPct = totalMacrosKcal > 0 ? round2((totalCarbs * 4) / totalMacrosKcal * 100) : 0;
  const fatPct = totalMacrosKcal > 0 ? round2((totalFat * 9) / totalMacrosKcal * 100) : 0;

  // Sugerencia de maridaje (bebida)
  const drinkPairings: Record<string, string> = {
    desayuno: "Café con leche o zumo de naranja natural",
    comida: "Agua con gas, cerveza suave o vino blanco ligero",
    cena: "Infusión digestiva o vino tinto joven",
    snack: "Té verde o batido de frutas",
  };

  return {
    success: true,
    generated_at: new Date().toISOString(),
    recipe: {
      name: recipeName,
      meal_type: mealType,
      servings: 2,
      prep_time_min: timing.prepTimeMin,
      cook_time_min: timing.cookTimeMin,
      total_time_min: timing.totalTimeMin,
      difficulty: timing.totalTimeMin <= 25 ? "fácil" : timing.totalTimeMin <= 45 ? "media" : "difícil",
      ingredients: wasAdjusted ? adjustedIngredients : ingredientDetails,
      original_ingredients: wasAdjusted ? ingredientDetails : undefined,
      was_kcal_adjusted: wasAdjusted,
      steps,
      nutrition_totals: {
        kcal: totalKcal,
        protein_g: totalProtein,
        carbs_g: totalCarbs,
        fat_g: totalFat,
        protein_pct: proteinPct,
        carbs_pct: carbsPct,
        fat_pct: fatPct,
        per_serving: {
          kcal: round2(totalKcal / 2),
          protein_g: round2(totalProtein / 2),
          carbs_g: round2(totalCarbs / 2),
          fat_g: round2(totalFat / 2),
        },
      },
      nutrition_score: scoreNutritionBalance(totalProtein, totalCarbs, totalFat, totalKcal, mealType),
      drink_pairing: drinkPairings[mealType] || "Agua",
      tips: generateTips(ingredients, mealType),
    },
  };
});

// Evalúa el balance nutricional de la receta
function scoreNutritionBalance(
  protein: number,
  carbs: number,
  fat: number,
  kcal: number,
  mealType: string,
): { score: number; label: string; verdict: string } {
  const ranges: Record<string, { kcal: [number, number]; protein_pct: [number, number]; fat_pct: [number, number] }> = {
    desayuno: { kcal: [250, 450], protein_pct: [10, 25], fat_pct: [15, 35] },
    comida: { kcal: [500, 800], protein_pct: [20, 40], fat_pct: [20, 40] },
    cena: { kcal: [400, 650], protein_pct: [20, 40], fat_pct: [15, 35] },
    snack: { kcal: [100, 300], protein_pct: [5, 20], fat_pct: [10, 35] },
  };

  const range = ranges[mealType] || ranges.comida;

  let score = 50; // base
  const notes: string[] = [];

  // Kcal en rango
  if (kcal >= range.kcal[0] && kcal <= range.kcal[1]) {
    score += 20;
  } else if (kcal < range.kcal[0] * 0.7) {
    score += 5;
    notes.push("Bajo en calorías");
  } else if (kcal > range.kcal[1] * 1.3) {
    score += 5;
    notes.push("Alto en calorías");
  } else {
    score += 10;
  }

  // Balance de macronutrientes
  const totalMacroKcal = protein * 4 + carbs * 4 + fat * 9;
  const proteinPct = totalMacroKcal > 0 ? ((protein * 4) / totalMacroKcal) * 100 : 0;
  const fatPct = totalMacroKcal > 0 ? ((fat * 9) / totalMacroKcal) * 100 : 0;

  if (proteinPct >= range.protein_pct[0] && proteinPct <= range.protein_pct[1]) {
    score += 15;
  } else {
    score += 5;
    notes.push(proteinPct < range.protein_pct[0] ? "Bajo en proteína" : "Alto en proteína");
  }

  if (fatPct >= range.fat_pct[0] && fatPct <= range.fat_pct[1]) {
    score += 15;
  } else {
    score += 5;
    notes.push(fatPct < range.fat_pct[0] ? "Bajo en grasas" : "Alto en grasas");
  }

  score = Math.min(100, Math.max(0, score));

  let label: string;
  let verdict: string;
  if (score >= 80) {
    label = "Excelente";
    verdict = "Receta muy bien balanceada para este tipo de comida.";
  } else if (score >= 60) {
    label = "Buena";
    verdict = `Receta aceptable. ${notes.length > 0 ? "Puntos de mejora: " + notes.join(". ") + "." : ""}`;
  } else if (score >= 40) {
    label = "Regular";
    verdict = `Receta con margen de mejora. ${notes.length > 0 ? "Considera ajustar: " + notes.join(". ") + "." : ""}`;
  } else {
    label = "Mejorable";
    verdict = `Receta con desbalances importantes. ${notes.length > 0 ? "Revisa: " + notes.join(". ") + "." : ""}`;
  }

  return { score, label, verdict };
}

// Genera consejos culinarios
function generateTips(
  ingredients: RecipeIngredientInput[],
  mealType: string,
): string[] {
  const tips: string[] = [];
  const categorized = ingredients.map((i) => ({
    ...i,
    category: i.category || classifyIngredient(i.name),
  }));

  const hasProtein = categorized.some((i) => i.category === "proteina");
  const hasVeggie = categorized.some((i) => i.category === "verdura");
  const hasGreenVeggie = categorized.some((i) => {
    const n = NORMALIZE(i.name);
    return n.includes("espinacas") || n.includes("brocoli") || n.includes("acelgas") || n.includes("lechuga");
  });

  if (mealType === "comida" && hasProtein) {
    tips.push("Deja reposar la carne 3-5 minutos después de cocinarla para que los jugos se redistribuyan.");
  }
  if (hasGreenVeggie) {
    tips.push("Las verduras de hoja verde conservan mejor sus nutrientes con cocciones cortas al vapor o salteado rápido.");
  }
  if (categorized.some((i) => NORMALIZE(i.name).includes("ajo"))) {
    tips.push("Añade el ajo picado al final del sofrito para evitar que se queme y amargue.");
  }
  if (categorized.some((i) => NORMALIZE(i.name).includes("pasta"))) {
    tips.push("Reserva un cazo del agua de cocción de la pasta para emulsionar la salsa si queda muy espesa.");
  }
  if (hasVeggie && hasProtein) {
    tips.push("Corta todos los ingredientes en tamaños similares para una cocción más uniforme.");
  }
  tips.push("Rectifica siempre el punto de sal antes de servir.");

  return tips;
}
