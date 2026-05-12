export function isCountBasedUnit(unitType) {
  const value = String(unitType || "").trim().toLowerCase();
  return value === "ud" || value === "unidad" || value === "pack";
}

export function validateRecipeBase({
  ingredientBase,
  baseKcal,
  minIngredientGrams,
  minBaseKcal,
  isSpecial,
  isCountBasedUnit: isCountUnit = isCountBasedUnit,
}) {
  if (isSpecial) {
    return { valid: true, issues: [], usesRelativeQuantities: false };
  }

  const issues = [];
  const blockingIssues = [];
  for (const ing of ingredientBase || []) {
    const grams = Number(ing.grams);
    const quantity = Number(ing.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      issues.push({
        code: "invalid_recipe_quantity",
        ingredient_name: ing.name,
        quantity,
        unit_type: ing.unit_type,
        grams,
        message: "ingredient quantity must be > 0",
      });
      blockingIssues.push("invalid_recipe_quantity");
      continue;
    }
    if (
      Number.isFinite(grams) &&
      grams > 0 &&
      grams < Number(minIngredientGrams || 0) &&
      !isCountUnit(ing.unit_type)
    ) {
      issues.push({
        code: "implausible_recipe_quantity",
        ingredient_name: ing.name,
        quantity,
        unit_type: ing.unit_type,
        grams,
        message: `ingredient grams below minimum threshold (${minIngredientGrams}g)`,
      });
    }
  }

  if (Number(baseKcal) < Number(minBaseKcal || 0)) {
    issues.push({
      code: "implausible_recipe_base_kcal",
      grams: null,
      message: `base kcal below minimum threshold (${minBaseKcal} kcal)`,
    });
  }

  return {
    valid: blockingIssues.length === 0,
    issues,
    usesRelativeQuantities: issues.some((issue) =>
      issue.code === "implausible_recipe_quantity" ||
      issue.code === "implausible_recipe_base_kcal"
    ),
  };
}

export function computeAppliedMultiplier({
  desiredMultiplier,
  minMultiplier,
  densityCap,
  maxMultiplier,
}) {
  const minValue = Math.max(1, Number(minMultiplier || 1));
  const densityLimit = Number.isFinite(Number(densityCap))
    ? Number(densityCap)
    : Number(maxMultiplier || minValue);
  const maxValue = Math.max(minValue, Number(maxMultiplier || densityLimit));
  const desired = Math.max(minValue, Number(desiredMultiplier || minValue));
  const cap = Math.min(densityLimit, maxValue);
  const applied = Math.max(minValue, Math.min(desired, cap));

  let capReason = "none";
  if (applied < desired && cap === densityLimit && cap < maxValue) {
    capReason = "density_cap";
  } else if (applied < desired && cap === maxValue) {
    capReason = "max_multiplier";
  }

  return {
    desiredMultiplier: desired,
    appliedMultiplier: applied,
    capReason,
  };
}

export function validateDayNutritionTotals({
  dayTotals,
  minKcalRatio,
  minProteinRatio,
}) {
  const violations = [];
  for (const total of dayTotals || []) {
    if (total?.all_special_day) continue;
    const targetKcal = Number(total?.target_kcal || 0);
    const targetProtein = Number(total?.target_protein_g || 0);
    const regularKcal = Number(total?.regular_kcal ?? total?.total_kcal ?? 0);
    const totalProtein = Number(total?.total_protein_g || 0);
    const kcalRatio = targetKcal > 0 ? regularKcal / targetKcal : 1;
    const proteinRatio = targetProtein > 0 ? totalProtein / targetProtein : 1;

    if (kcalRatio < minKcalRatio || proteinRatio < minProteinRatio) {
      violations.push({
        profile_id: total?.profile_id,
        profile_name: total?.profile_name,
        target_kcal: targetKcal,
        regular_kcal: regularKcal,
        total_kcal: Number(total?.total_kcal || 0),
        target_protein_g: targetProtein,
        total_protein_g: totalProtein,
        kcal_ratio: round(kcalRatio, 4),
        protein_ratio: round(proteinRatio, 4),
        min_kcal_ratio: minKcalRatio,
        min_protein_ratio: minProteinRatio,
      });
    }
  }
  return violations;
}

export function resolveCaloricDensityBucket({ caloricDensityLevel, kcalPer100g }) {
  const level = String(caloricDensityLevel || "").trim().toLowerCase();
  if (level === "very_caloric" || level === "muy_calorico") return "very_caloric";
  if (level === "caloric" || level === "calorico") return "caloric";
  if (
    level === "low" ||
    level === "low_caloric" ||
    level === "poco_calorico" ||
    level === "light"
  ) {
    return "low";
  }
  if (level === "normal") return "normal";

  const kcal = Number(kcalPer100g || 0);
  if (kcal > 400) return "very_caloric";
  if (kcal > 200) return "caloric";
  if (kcal > 0 && kcal < 80) return "low";
  return "normal";
}

export function densityFactorForBucket(bucket) {
  if (bucket === "very_caloric") return 0.35;
  if (bucket === "caloric") return 0.65;
  if (bucket === "low") return 1.35;
  return 1;
}

export function calculateDensityScaledQuantity({
  baseQuantity,
  mealMultiplier,
  caloricDensityLevel,
  kcalPer100g,
}) {
  const base = Math.max(0, Number(baseQuantity || 0));
  const multiplier = Math.max(1, Number(mealMultiplier || 1));
  const bucket = resolveCaloricDensityBucket({ caloricDensityLevel, kcalPer100g });
  const densityFactor = densityFactorForBucket(bucket);
  const ingredientMultiplier = 1 + (multiplier - 1) * densityFactor;
  const finalQuantity = Math.max(base, base * ingredientMultiplier);

  return {
    finalQuantity,
    ingredientMultiplier,
    densityBucket: bucket,
    densityFactor,
  };
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(Number(value || 0) * factor) / factor;
}
