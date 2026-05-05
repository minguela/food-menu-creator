export const USDA_ALIASES: Record<string, string> = {
  arroz: "rice",
  pollo: "chicken",
  pechuga_de_pollo: "chicken breast",
  patata: "potato",
  papas: "potato",
  avena: "oats",
  guisantes: "peas",
  calamares: "squid",
  lentejas: "lentils",
  garbanzos: "chickpeas",
  huevo: "egg",
  huevos: "eggs",
  tomate: "tomato",
  mozzarella: "mozzarella",
  calabacin: "zucchini",
  champinones: "mushrooms",
  champis: "mushrooms",
  atun: "tuna",
  salmon: "salmon",
  merluza: "hake",
  arroz_integral: "brown rice",
  aceite_de_oliva: "olive oil",
};

const STOP_WORDS = new Set([
  "fresco",
  "cocido",
  "asado",
  "a",
  "la",
  "al",
  "de",
  "del",
]);

export const NON_APPLICABLE = [
  "libre",
  "ensalada completa",
  "pescado a elegir",
  "guarnicion",
  "plato combinado",
  "3 fuentes de prote",
];

export const normalizeIngredientName = (name: string): string => {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const tokens = base
    .split(" ")
    .filter(Boolean)
    .filter((token) => !STOP_WORDS.has(token))
    .map((token) => {
      if (token.length > 4 && token.endsWith("es")) return token.slice(0, -2);
      if (token.length > 3 && token.endsWith("s")) return token.slice(0, -1);
      return token;
    });

  return tokens.join("_");
};

export const isNonApplicableIngredient = (name: string) => {
  const normalized = normalizeIngredientName(name).replace(/_/g, " ");
  return NON_APPLICABLE.some((blocked) => normalized.includes(blocked));
};

export const scoreIngredientCandidate = (
  originalName: string,
  candidateName: string,
  aliasQuery?: string,
) => {
  const original = normalizeIngredientName(originalName);
  const candidate = normalizeIngredientName(candidateName);
  const aliasNormalized = aliasQuery ? normalizeIngredientName(aliasQuery) : "";

  if (!original || !candidate) return 0;
  if (original === candidate) return 0.98;
  if (aliasNormalized && aliasNormalized === candidate) return 0.9;

  const originalWords = new Set(original.split("_"));
  const candidateWords = new Set(candidate.split("_"));
  const intersection = [...originalWords].filter((w) => candidateWords.has(w));
  const overlap = intersection.length / Math.max(originalWords.size, 1);
  const startsWithOriginal = candidate.startsWith(`${original}_`) || candidate === original;
  const startsWithAlias =
    aliasNormalized &&
    (candidate.startsWith(`${aliasNormalized}_`) || candidate === aliasNormalized);

  if (originalWords.size === 1 && overlap > 0 && !startsWithOriginal && !startsWithAlias) {
    return 0.74;
  }

  if (startsWithOriginal || startsWithAlias) return 0.92;
  if (overlap >= 0.8) return 0.88;
  if (overlap >= 0.5) return 0.7;
  if (overlap > 0) return 0.55;
  return 0.25;
};

export const toNutrientNumberOrNull = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};
