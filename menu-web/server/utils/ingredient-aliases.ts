import { USDA_ALIASES, normalizeIngredientName } from "~~/server/utils/ingredient-enrichment";

const TOKEN_TRANSLATIONS: Record<string, string> = {
  aceite: "oil",
  oliva: "olive",
  pollo: "chicken",
  pechuga: "breast",
  pechugas: "breast",
  arroz: "rice",
  integral: "brown",
  patata: "potato",
  patatas: "potato",
  papa: "potato",
  papas: "potato",
  calabacin: "zucchini",
  zanahoria: "carrot",
  zanahorias: "carrot",
  cebolla: "onion",
  cebollas: "onion",
  ajo: "garlic",
  tomate: "tomato",
  tomates: "tomato",
  champinon: "mushroom",
  champinones: "mushrooms",
  champis: "mushrooms",
  atun: "tuna",
  salmon: "salmon",
  merluza: "hake",
  huevos: "eggs",
  huevo: "egg",
  lentejas: "lentils",
  garbanzos: "chickpeas",
  guisantes: "peas",
  calamares: "squid",
  ternera: "beef",
  cerdo: "pork",
  yogur: "yogurt",
  griego: "greek",
  avena: "oats",
  mozarella: "mozzarella",
  mozzarella: "mozzarella",
  judias: "green beans",
  verdes: "green",
  pimiento: "pepper",
  pimientos: "peppers",
  lechuga: "lettuce",
  pepino: "cucumber",
  espinacas: "spinach",
};

type AliasMatch = {
  aliasEs: string;
  aliasEn: string;
  normalizedAliasEs: string;
  normalizedAliasEn: string;
  source: "system" | "auto_needs_review";
};

export const buildEnglishAliasForIngredient = (name: string): AliasMatch => {
  const aliasEs = String(name || "").trim();
  const normalizedAliasEs = normalizeIngredientName(aliasEs);
  const direct = USDA_ALIASES[normalizedAliasEs];

  if (direct) {
    const normalizedAliasEn = normalizeIngredientName(direct);
    return {
      aliasEs,
      aliasEn: direct,
      normalizedAliasEs,
      normalizedAliasEn,
      source: "system",
    };
  }

  const translated = normalizedAliasEs
    .split("_")
    .map((token) => TOKEN_TRANSLATIONS[token] || token)
    .join(" ")
    .trim();

  const aliasEn = translated || normalizedAliasEs.replace(/_/g, " ");
  return {
    aliasEs,
    aliasEn,
    normalizedAliasEs,
    normalizedAliasEn: normalizeIngredientName(aliasEn),
    source: "auto_needs_review",
  };
};

