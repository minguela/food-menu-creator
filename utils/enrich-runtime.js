export const normalizeEnrichSource = (value) => {
  const source = String(value || "auto")
    .trim()
    .toLowerCase();
  if (source === "usda") return "usda";
  if (source === "open_food_facts") return "open_food_facts";
  if (source === "bedca") return "bedca";
  return "auto";
};

export const resolveSupabaseServerKey = ({
  runtimeServiceKey,
  envServiceRole,
  envNuxtServiceKey,
  envSupabaseKey,
  publicAnonKey,
}) => {
  return (
    runtimeServiceKey ||
    envServiceRole ||
    envNuxtServiceKey ||
    envSupabaseKey ||
    publicAnonKey ||
    ""
  );
};

export const resolveUsdaKey = ({
  runtimeUsdaKey,
  envUsdaFdc,
  envUsdaLegacy,
  envNuxtUsda,
}) => {
  return runtimeUsdaKey || envUsdaFdc || envUsdaLegacy || envNuxtUsda || "";
};

export const shouldTryUsda = (source) => source === "auto" || source === "usda";
export const shouldTryOff = (source) =>
  source === "auto" || source === "open_food_facts";
