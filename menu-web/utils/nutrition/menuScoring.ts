import type { NutritionTotals } from "./calculateRecipeMacros";
import { roundNutrition } from "./calculateRecipeMacros";
import type { ProfileNutritionTargets } from "./profileTargets";
import { lowerToleranceBound, toleranceBounds } from "./profileTargets";

export type MacroDeviation = {
  actual: number;
  target: number;
  delta: number;
  percentDelta: number;
  min: number;
  max: number;
  withinTolerance: boolean;
};

export type MenuCompliance = {
  meetsTargets: boolean;
  kcal: MacroDeviation;
  proteinG: MacroDeviation;
  carbsG: MacroDeviation;
  fatG: MacroDeviation;
};

export type MenuScoreWeights = {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  proteinShortfallExtra: number;
  repeatedRecipe: number;
  tagVarietyBonus: number;
};

export type MenuScoringInput = {
  totals: NutritionTotals;
  targets: Pick<
    ProfileNutritionTargets,
    | "targetKcal"
    | "targetProteinG"
    | "targetCarbsG"
    | "targetFatG"
    | "tolerancePercent"
  > &
    Partial<Pick<ProfileNutritionTargets, "bounds">>;
  repeatedRecipeIds?: string[];
  tags?: string[];
  weights?: Partial<MenuScoreWeights>;
};

export type MenuScoreResult = MenuCompliance & {
  score: number;
  baseScore: number;
  penalties: {
    proteinShortfall: number;
    repeatedRecipes: number;
  };
  bonuses: {
    tagVariety: number;
  };
};

export type ScoredMenuOption<T> = T & {
  score: number;
  tieBreaker?: string | number | null;
};

export const DEFAULT_MENU_SCORE_WEIGHTS: MenuScoreWeights = {
  kcal: 1,
  proteinG: 4,
  carbsG: 2,
  fatG: 2,
  proteinShortfallExtra: 6,
  repeatedRecipe: 100,
  tagVarietyBonus: 2,
};

export function scoreMenu(input: MenuScoringInput): MenuScoreResult {
  const weights = { ...DEFAULT_MENU_SCORE_WEIGHTS, ...(input.weights || {}) };
  const compliance = calculateMenuCompliance(input.totals, input.targets);

  const baseScore =
    Math.abs(compliance.kcal.delta) * weights.kcal +
    Math.abs(compliance.proteinG.delta) * weights.proteinG +
    Math.abs(compliance.carbsG.delta) * weights.carbsG +
    Math.abs(compliance.fatG.delta) * weights.fatG;

  const proteinShortfall = Math.max(0, -compliance.proteinG.delta) *
    weights.proteinShortfallExtra;
  const repeatedRecipes = uniqueCount(input.repeatedRecipeIds || []) *
    weights.repeatedRecipe;
  const tagVariety = uniqueCount(input.tags || []) * weights.tagVarietyBonus;
  const score = Math.max(
    0,
    baseScore + proteinShortfall + repeatedRecipes - tagVariety,
  );

  return {
    ...compliance,
    score: roundNutrition(score, 4),
    baseScore: roundNutrition(baseScore, 4),
    penalties: {
      proteinShortfall: roundNutrition(proteinShortfall, 4),
      repeatedRecipes: roundNutrition(repeatedRecipes, 4),
    },
    bonuses: {
      tagVariety: roundNutrition(tagVariety, 4),
    },
  };
}

export function calculateMenuCompliance(
  totals: NutritionTotals,
  targets: MenuScoringInput["targets"],
): MenuCompliance {
  const bounds = targets.bounds || {
    kcal: toleranceBounds(targets.targetKcal, targets.tolerancePercent),
    proteinG: {
      min: lowerToleranceBound(targets.targetProteinG, targets.tolerancePercent),
      max: Number.POSITIVE_INFINITY,
    },
    carbsG: toleranceBounds(targets.targetCarbsG, targets.tolerancePercent),
    fatG: toleranceBounds(targets.targetFatG, targets.tolerancePercent),
  };

  const compliance = {
    kcal: buildDeviation(totals.kcal, targets.targetKcal, bounds.kcal.min, bounds.kcal.max),
    proteinG: buildDeviation(
      totals.proteinG,
      targets.targetProteinG,
      bounds.proteinG.min,
      bounds.proteinG.max,
    ),
    carbsG: buildDeviation(
      totals.carbsG,
      targets.targetCarbsG,
      bounds.carbsG.min,
      bounds.carbsG.max,
    ),
    fatG: buildDeviation(totals.fatG, targets.targetFatG, bounds.fatG.min, bounds.fatG.max),
  };

  return {
    ...compliance,
    meetsTargets:
      compliance.kcal.withinTolerance &&
      compliance.proteinG.withinTolerance &&
      compliance.carbsG.withinTolerance &&
      compliance.fatG.withinTolerance,
  };
}

export function buildDeviation(
  actual: number,
  target: number,
  min: number,
  max: number,
): MacroDeviation {
  const safeTarget = Number(target || 0);
  const delta = Number(actual || 0) - safeTarget;
  return {
    actual: roundNutrition(actual),
    target: roundNutrition(safeTarget),
    delta: roundNutrition(delta),
    percentDelta: safeTarget > 0 ? roundNutrition((delta / safeTarget) * 100) : 0,
    min: roundNutrition(min),
    max: max === Number.POSITIVE_INFINITY ? max : roundNutrition(max),
    withinTolerance: Number(actual || 0) >= min && Number(actual || 0) <= max,
  };
}

export function selectBestScoredOption<T>(
  options: Array<ScoredMenuOption<T>>,
): ScoredMenuOption<T> | null {
  if (options.length === 0) return null;

  return [...options].sort((left, right) => {
    const scoreDelta = Number(left.score || 0) - Number(right.score || 0);
    if (scoreDelta !== 0) return scoreDelta;
    return String(left.tieBreaker ?? "").localeCompare(
      String(right.tieBreaker ?? ""),
    );
  })[0];
}

function uniqueCount(values: string[]): number {
  return new Set(values.map((value) => String(value || "").trim()).filter(Boolean))
    .size;
}
