export type IngredientCandidate = {
  name: string;
  confidence: "high" | "medium" | "low";
  source: "dish_name";
  needs_review: boolean;
};

const COOKING_PHRASES = [
  "a la plancha",
  "al horno",
  "con guarnicion",
  "con guarnición",
  "huevo escalfado",
  "huevos escalfados",
  "huevo revuelto",
  "huevos revueltos",
  "revueltos",
  "revuelto",
  "escalfado",
  "salteado",
  "salteado de",
  "asado",
  "crema de",
];

const GENERIC_WORDS = new Set([
  "completa",
  "mixta",
  "elegir",
  "guarnicion",
  "guarnición",
  "plato",
  "prote",
  "fuentes",
  "fuente",
  "menu",
  "menú",
]);

const DIRECT_PENDING_PATTERNS = [
  /^libre$/,
  /pescado a elegir/,
  /ensalada completa/,
  /plato combinado/,
  /3 fuentes de prote/,
];

function normalizeText(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanDishText(name: string) {
  let text = normalizeText(name);
  for (const phrase of COOKING_PHRASES) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    text = text.replace(new RegExp(`\\b${escaped}\\b`, "g"), " ");
  }
  return text.replace(/\s+/g, " ").trim();
}

function normalizeCandidateName(value: string) {
  const raw = value.trim().replace(/\s+/g, " ");
  if (!raw) return "";
  if (raw === "champis") return "champiñones";
  return raw;
}

function shouldSkipCandidate(value: string) {
  if (!value) return true;
  if (value.length < 2) return true;
  if (GENERIC_WORDS.has(value)) return true;
  if (/^\d+$/.test(value)) return true;
  return false;
}

export function getRecipeStatusFromDishName(
  dishName: string,
  candidates: IngredientCandidate[],
): "pending_ingredients" | "suggested_ingredients" | "not_required" {
  const normalized = normalizeText(dishName);
  if (normalized === "libre") return "not_required";
  if (candidates.length > 0) return "suggested_ingredients";
  return "pending_ingredients";
}

export function extractIngredientCandidatesFromDishName(
  dishName: string,
): IngredientCandidate[] {
  const normalized = normalizeText(dishName);
  if (!normalized) return [];
  if (normalized === "libre") return [];
  if (DIRECT_PENDING_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return [];
  }

  const hasAlternative = /\bo\b/.test(normalized);
  const hasGuarnicion = /\bguarnicion\b|\bguarnición\b/.test(normalized);
  const hasVerdurasAlone = /\bverduras\b/.test(normalized);
  const base = cleanDishText(normalized)
    .replace(/\bcon\b/g, "|")
    .replace(/\bde\b/g, "|")
    .replace(/\by\b/g, "|")
    .replace(/[,+]/g, "|")
    .replace(/\s+/g, " ")
    .trim();

  const tokens = base
    .split("|")
    .map((part) => normalizeCandidateName(part))
    .filter((part) => !shouldSkipCandidate(part));

  const unique = Array.from(new Set(tokens));

  return unique.map((name) => {
    const needsReview =
      hasAlternative ||
      hasGuarnicion ||
      (name === "verduras" && hasVerdurasAlone);
    return {
      name,
      confidence: needsReview ? "medium" : "high",
      source: "dish_name",
      needs_review: needsReview,
    };
  });
}
