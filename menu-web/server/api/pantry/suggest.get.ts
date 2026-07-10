/**
 * GET /api/pantry/suggest
 *
 * Modo "nevera inteligente": sugiere recetas que se pueden cocinar
 * con los ingredientes que el usuario ya tiene disponibles.
 *
 * Query params:
 * - ingredients: string (separado por comas) — ingredientes disponibles
 * - ingredients[]: string[] (repetible) — alternativa para listas largas
 * - limit?: number — máximo de sugerencias (default 10)
 * - mealType?: "desayuno" | "comida" | "cena" | "snack" — filtrar por tipo
 * - matchThreshold?: number (0-1) — umbral de coincidencia (default 0.3)
 *
 * Devuelve recetas puntuadas por % de ingredientes cubiertos, con
 * indicación de qué ingredientes tienes vs. qué te falta comprar.
 */

// Base de recetas predefinidas con sus ingredientes (simuladas)
interface PantryRecipe {
  id: string;
  name: string;
  meal_type: "desayuno" | "comida" | "cena" | "snack";
  ingredients: string[];
  base_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  time_min: number;
  difficulty: "fácil" | "media" | "difícil";
  tags: string[];
}

const PANTRY_RECIPES: PantryRecipe[] = [
  // DESAYUNOS
  {
    id: "pantry-d01",
    name: "Tostadas con aguacate y huevo",
    meal_type: "desayuno",
    ingredients: ["pan integral", "aguacate", "huevos", "sal", "pimienta", "aceite de oliva"],
    base_kcal: 420,
    protein_g: 18,
    carbs_g: 35,
    fat_g: 24,
    time_min: 10,
    difficulty: "fácil",
    tags: ["rápido", "saludable", "saciante"],
  },
  {
    id: "pantry-d02",
    name: "Porridge de avena con plátano",
    meal_type: "desayuno",
    ingredients: ["avena", "leche", "plátano", "miel", "canela"],
    base_kcal: 380,
    protein_g: 12,
    carbs_g: 62,
    fat_g: 8,
    time_min: 12,
    difficulty: "fácil",
    tags: ["energético", "fibra", "dulce"],
  },
  {
    id: "pantry-d03",
    name: "Yogur con granola y frutos rojos",
    meal_type: "desayuno",
    ingredients: ["yogur", "avena", "fresas", "nueces", "miel"],
    base_kcal: 350,
    protein_g: 14,
    carbs_g: 42,
    fat_g: 14,
    time_min: 5,
    difficulty: "fácil",
    tags: ["rápido", "probiótico", "antioxidante"],
  },

  // COMIDAS
  {
    id: "pantry-c01",
    name: "Pollo salteado con verduras",
    meal_type: "comida",
    ingredients: ["pechuga de pollo", "pimiento", "cebolla", "zanahoria", "salsa de soja", "aceite de oliva", "ajo", "jengibre"],
    base_kcal: 420,
    protein_g: 38,
    carbs_g: 18,
    fat_g: 22,
    time_min: 25,
    difficulty: "media",
    tags: ["proteico", "wok", "oriental"],
  },
  {
    id: "pantry-c02",
    name: "Arroz tres delicias",
    meal_type: "comida",
    ingredients: ["arroz blanco", "huevos", "gambas", "guisantes", "zanahoria", "cebolla", "aceite de oliva", "salsa de soja"],
    base_kcal: 550,
    protein_g: 28,
    carbs_g: 65,
    fat_g: 18,
    time_min: 30,
    difficulty: "media",
    tags: ["asiático", "completo", "clásico"],
  },
  {
    id: "pantry-c03",
    name: "Ensalada completa de atún",
    meal_type: "comida",
    ingredients: ["lechuga", "atún", "tomate", "huevos", "aceitunas", "cebolla", "aceite de oliva", "vinagre"],
    base_kcal: 380,
    protein_g: 32,
    carbs_g: 12,
    fat_g: 22,
    time_min: 15,
    difficulty: "fácil",
    tags: ["fresco", "verano", "proteico"],
  },
  {
    id: "pantry-c04",
    name: "Lentejas estofadas con verduras",
    meal_type: "comida",
    ingredients: ["lentejas", "zanahoria", "cebolla", "pimiento", "tomate", "ajo", "pimentón", "laurel", "aceite de oliva", "caldo de pollo"],
    base_kcal: 480,
    protein_g: 24,
    carbs_g: 62,
    fat_g: 14,
    time_min: 45,
    difficulty: "media",
    tags: ["legumbre", "invierno", "fibra"],
  },
  {
    id: "pantry-c05",
    name: "Pasta con salsa de tomate casera",
    meal_type: "comida",
    ingredients: ["pasta", "tomate", "cebolla", "ajo", "aceite de oliva", "orégano", "albahaca", "queso rallado"],
    base_kcal: 520,
    protein_g: 18,
    carbs_g: 72,
    fat_g: 16,
    time_min: 30,
    difficulty: "fácil",
    tags: ["italiano", "vegetariano", "clásico"],
  },
  {
    id: "pantry-c06",
    name: "Salmón al horno con patatas",
    meal_type: "comida",
    ingredients: ["salmón", "patatas", "limón", "eneldo", "aceite de oliva", "sal", "pimienta"],
    base_kcal: 560,
    protein_g: 38,
    carbs_g: 40,
    fat_g: 25,
    time_min: 35,
    difficulty: "fácil",
    tags: ["omega3", "horno", "saludable"],
  },
  {
    id: "pantry-c07",
    name: "Guiso de garbanzos con espinacas",
    meal_type: "comida",
    ingredients: ["garbanzos", "espinacas", "cebolla", "ajo", "comino", "pimentón", "tomate", "aceite de oliva"],
    base_kcal: 440,
    protein_g: 20,
    carbs_g: 52,
    fat_g: 16,
    time_min: 35,
    difficulty: "fácil",
    tags: ["legumbre", "vegetariano", "hierro"],
  },

  // CENAS
  {
    id: "pantry-dn01",
    name: "Tortilla francesa con ensalada",
    meal_type: "cena",
    ingredients: ["huevos", "lechuga", "tomate", "cebolla", "aceite de oliva", "vinagre", "sal"],
    base_kcal: 320,
    protein_g: 22,
    carbs_g: 8,
    fat_g: 22,
    time_min: 15,
    difficulty: "fácil",
    tags: ["ligero", "rápido", "proteico"],
  },
  {
    id: "pantry-dn02",
    name: "Crema de calabacín",
    meal_type: "cena",
    ingredients: ["calabacín", "cebolla", "patatas", "caldo de pollo", "queso", "aceite de oliva", "sal", "pimienta"],
    base_kcal: 250,
    protein_g: 10,
    carbs_g: 28,
    fat_g: 12,
    time_min: 25,
    difficulty: "fácil",
    tags: ["crema", "ligero", "digestivo"],
  },
  {
    id: "pantry-dn03",
    name: "Revuelto de champiñones y gambas",
    meal_type: "cena",
    ingredients: ["huevos", "champiñones", "gambas", "ajo", "perejil", "aceite de oliva", "sal"],
    base_kcal: 290,
    protein_g: 30,
    carbs_g: 4,
    fat_g: 18,
    time_min: 15,
    difficulty: "fácil",
    tags: ["bajo en carbs", "proteico", "rápido"],
  },
  {
    id: "pantry-dn04",
    name: "Pescado blanco a la plancha con verduras",
    meal_type: "cena",
    ingredients: ["merluza", "calabacín", "pimiento", "aceite de oliva", "limón", "sal", "perejil"],
    base_kcal: 280,
    protein_g: 32,
    carbs_g: 8,
    fat_g: 13,
    time_min: 20,
    difficulty: "fácil",
    tags: ["ligero", "saludable", "omega3"],
  },
  {
    id: "pantry-dn05",
    name: "Ensalada templada de quinoa",
    meal_type: "cena",
    ingredients: ["quinoa", "tomate", "pepino", "cebolla", "aceite de oliva", "limón", "perejil", "aguacate"],
    base_kcal: 360,
    protein_g: 14,
    carbs_g: 38,
    fat_g: 18,
    time_min: 25,
    difficulty: "fácil",
    tags: ["vegetariano", "completo", "fibra"],
  },

  // SNACKS
  {
    id: "pantry-s01",
    name: "Hummus de garbanzos con crudités",
    meal_type: "snack",
    ingredients: ["garbanzos", "aceite de oliva", "limón", "ajo", "comino", "zanahoria", "pepino"],
    base_kcal: 220,
    protein_g: 10,
    carbs_g: 24,
    fat_g: 10,
    time_min: 10,
    difficulty: "fácil",
    tags: ["vegetariano", "proteico", "snack saludable"],
  },
  {
    id: "pantry-s02",
    name: "Batido verde detox",
    meal_type: "snack",
    ingredients: ["espinacas", "manzana", "plátano", "leche", "jengibre"],
    base_kcal: 180,
    protein_g: 6,
    carbs_g: 32,
    fat_g: 3,
    time_min: 5,
    difficulty: "fácil",
    tags: ["detox", "verde", "vitaminas"],
  },
  {
    id: "pantry-s03",
    name: "Brochetas de fruta fresca",
    meal_type: "snack",
    ingredients: ["fresas", "plátano", "kiwi", "uvas", "miel"],
    base_kcal: 150,
    protein_g: 2,
    carbs_g: 34,
    fat_g: 1,
    time_min: 10,
    difficulty: "fácil",
    tags: ["fruta", "refrescante", "niños"],
  },
];

const NORMALIZE = (name: string): string =>
  name
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .replace(/[.,;:!¡¿?()]/g, "");

const round2 = (n: number): number => Math.round(n * 100) / 100;

function parseIngredients(query: ReturnType<typeof getQuery>): string[] {
  // Soporte para ingredients[]=pollo&ingredients[]=cebolla
  if (Array.isArray(query.ingredients)) {
    return query.ingredients.map((s: string) => String(s).trim()).filter(Boolean);
  }
  // Soporte para ingredients=pollo,cebolla,tomate
  if (typeof query.ingredients === "string" && query.ingredients.trim()) {
    return query.ingredients.split(",").map((s) => s.trim()).filter(Boolean);
  }
  // Soporte para ingredients[0]=pollo&ingredients[1]=cebolla
  const result: string[] = [];
  for (const key of Object.keys(query)) {
    if (key.startsWith("ingredients[") && key.endsWith("]")) {
      const value = query[key];
      if (typeof value === "string" && value.trim()) {
        result.push(value.trim());
      }
    }
  }
  return result;
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const availableIngredients = parseIngredients(query);

  if (availableIngredients.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "Se requiere al menos un ingrediente. Usa ?ingredients=pollo,cebolla o ?ingredients[]=pollo&ingredients[]=cebolla",
    });
  }

  const limit = Math.min(50, Math.max(1, Number(query.limit || 10) || 10));
  const preferredMealType = query.mealType as string | undefined;
  const matchThreshold = Math.min(1, Math.max(0, Number(query.matchThreshold || 0.3) || 0.3));

  const normalizedAvailable = availableIngredients.map(NORMALIZE);

  // Calcula el score de coincidencia para cada receta
  const scored = PANTRY_RECIPES.map((recipe) => {
    const normalizedRecipeIngredients = recipe.ingredients.map(NORMALIZE);

    // Ingredientes que tienes
    const matched: string[] = [];
    // Ingredientes que te faltan
    const missing: string[] = [];

    for (let i = 0; i < recipe.ingredients.length; i++) {
      const normRecipeIng = normalizedRecipeIngredients[i];

      // Búsqueda flexible: coincidencia exacta o por subcadena
      const found = normalizedAvailable.some(
        (avail) =>
          avail === normRecipeIng ||
          avail.includes(normRecipeIng) ||
          normRecipeIng.includes(avail),
      );

      if (found) {
        matched.push(recipe.ingredients[i]);
      } else {
        missing.push(recipe.ingredients[i]);
      }
    }

    const matchPercent = recipe.ingredients.length > 0
      ? matched.length / recipe.ingredients.length
      : 0;

    // Score ponderado: % de coincidencia + bonificación por tener proteína principal
    let score = matchPercent;

    // Bonificación si tienes el ingrediente principal (primero de la lista)
    if (matched.includes(recipe.ingredients[0])) {
      score += 0.1;
    }

    // Penalización leve si faltan ingredientes críticos
    if (missing.length >= recipe.ingredients.length / 2) {
      score -= 0.1;
    }

    score = Math.max(0, Math.min(1, score));

    return {
      recipe,
      match_percent: round2(matchPercent * 100),
      matched_ingredients: matched,
      missing_ingredients: missing,
      match_score: round2(score),
    };
  });

  // Filtrar y ordenar
  let filtered = scored.filter((s) => s.match_score >= matchThreshold);

  // Filtrar por tipo de comida si se solicita
  if (preferredMealType && ["desayuno", "comida", "cena", "snack"].includes(preferredMealType)) {
    filtered = filtered.filter((s) => s.recipe.meal_type === preferredMealType);
  }

  // Ordenar por score descendente, luego por % de coincidencia
  filtered.sort((a, b) => {
    if (b.match_score !== a.match_score) return b.match_score - a.match_score;
    return b.match_percent - a.match_percent;
  });

  // Limitar resultados
  const results = filtered.slice(0, limit);

  // Estadísticas de la nevera
  const pantryStats = {
    total_ingredients: availableIngredients.length,
    total_recipes_available: PANTRY_RECIPES.length,
    recipes_possible: filtered.length,
    fully_covered: results.filter((r) => r.match_percent >= 90).length,
    best_match_score: results[0]?.match_score ?? 0,
    suggested_ingredients: suggestAdditionalIngredients(
      normalizedAvailable,
      filtered.slice(0, 5).flatMap((r) => r.missing_ingredients),
    ),
  };

  return {
    success: true,
    queried_at: new Date().toISOString(),
    available_ingredients: availableIngredients,
    match_threshold: matchThreshold,
    results: results.map((r) => ({
      id: r.recipe.id,
      name: r.recipe.name,
      meal_type: r.recipe.meal_type,
      match_percent: r.match_percent,
      match_score: r.match_score,
      matched_ingredients: r.matched_ingredients,
      missing_ingredients: r.missing_ingredients,
      nutrition: {
        kcal: r.recipe.base_kcal,
        protein_g: r.recipe.protein_g,
        carbs_g: r.recipe.carbs_g,
        fat_g: r.recipe.fat_g,
      },
      time_min: r.recipe.time_min,
      difficulty: r.recipe.difficulty,
      tags: r.recipe.tags,
    })),
    pantry_stats: pantryStats,
  };
});

// Sugiere qué ingredientes adicionales comprar para desbloquear más recetas
function suggestAdditionalIngredients(
  available: string[],
  topMissing: string[],
): string[] {
  const freq = new Map<string, number>();
  for (const ing of topMissing) {
    const norm = NORMALIZE(ing);
    freq.set(norm, (freq.get(norm) || 0) + 1);
  }
  // Filtrar los que ya tienes
  const suggestions = Array.from(freq.entries())
    .filter(([norm]) => !available.some((a) => a === norm || a.includes(norm) || norm.includes(a)))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Buscar el nombre original más bonito
  return suggestions.map(([norm]) => {
    for (const recipe of PANTRY_RECIPES) {
      const found = recipe.ingredients.find((i) => NORMALIZE(i) === norm);
      if (found) return found;
    }
    return norm;
  });
}
