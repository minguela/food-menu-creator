import type { MealType, PersonProfile } from "~/types";
import {
  addNutritionTotals,
  calculateRecipeMacros,
  EMPTY_NUTRITION_TOTALS,
  scaleNutritionTotals,
  SERVING_MULTIPLIERS,
  type IngredientMacroContribution,
  type NutritionTotals,
  type RecipeMacroIssue,
  type ServingMultiplier,
} from "~/utils/nutrition/calculateRecipeMacros";
import {
  profileTargetsFromProfile,
  type ProfileNutritionTargets,
} from "~/utils/nutrition/profileTargets";
import {
  scoreMenu,
  selectBestScoredOption,
  type MenuScoreResult,
} from "~/utils/nutrition/menuScoring";

type SupabaseClientLike = {
  from: (table: string) => any;
};

export type MenuPeriodType = "daily" | "weekly" | "monthly";

export type MenuGeneratorLog = {
  level: "debug" | "info" | "warn" | "error";
  step: string;
  message: string;
  metadata?: Record<string, unknown>;
};

export type MenuGeneratorLogger = (entry: MenuGeneratorLog) => void | Promise<void>;

export type RecipeCandidate = {
  recipeId: string;
  name: string;
  mealType: MealType;
  servings: number;
  tags: string[];
  totals: NutritionTotals;
  ingredients: IngredientMacroContribution[];
};

export type ExcludedRecipeCandidate = {
  recipeId: string;
  name: string;
  reason:
    | "missing_meal_type"
    | "unsupported_meal_type"
    | "not_complete"
    | "special_recipe"
    | "macro_calculation_failed";
  issues?: RecipeMacroIssue[];
};

export type RecipeCandidatesByMealType = Record<MealType, RecipeCandidate[]>;

export type GeneratedMenuMeal = {
  recipeId: string;
  name: string;
  mealType: MealType;
  servingMultiplier: ServingMultiplier;
  totals: NutritionTotals;
  tags: string[];
};

export type GeneratedMenuDay = {
  dayIndex: number;
  dayDate: string;
  meals: GeneratedMenuMeal[];
  totals: NutritionTotals;
  score: number;
  meetsTargets: boolean;
  diagnostics: MenuScoreResult;
};

export type GeneratedMenuPeriodSummary = {
  daysCount: number;
  globalScore: number;
  averageScore: number;
  averageTotals: NutritionTotals;
  compliantDays: number;
};

export type GeneratedMenuResult = {
  periodType: MenuPeriodType;
  targets: ProfileNutritionTargets;
  days: GeneratedMenuDay[];
  summary: GeneratedMenuPeriodSummary;
  candidates: {
    byMealType: Record<MealType, number>;
    excluded: ExcludedRecipeCandidate[];
  };
};

export type GenerateNutritionMenuParams = {
  supabase: SupabaseClientLike;
  userId: string;
  profile: PersonProfile;
  periodType: MenuPeriodType;
  startDate: string;
  days?: number;
  includeSnack?: boolean;
  maxCandidatesPerMealType?: number;
  maxVariantsPerMealType?: number;
  logger?: MenuGeneratorLogger;
};

type GeneratePeriodParams = {
  targets: ProfileNutritionTargets;
  periodType: MenuPeriodType;
  startDate: string;
  candidatesByMealType: RecipeCandidatesByMealType;
  excludedCandidates: ExcludedRecipeCandidate[];
  days?: number;
  includeSnack?: boolean;
  maxCandidatesPerMealType?: number;
  maxVariantsPerMealType?: number;
  logger?: MenuGeneratorLogger;
};

type CandidateVariant = {
  candidate: RecipeCandidate;
  multiplier: ServingMultiplier;
  totals: NutritionTotals;
  compatibilityScore: number;
  tieBreaker: string;
};

type DailyCombinationOption = {
  meals: GeneratedMenuMeal[];
  totals: NutritionTotals;
  diagnostics: MenuScoreResult;
  score: number;
  tieBreaker: string;
};

const MAX_CANDIDATES_PER_MEAL_TYPE = 30;
const MAX_VARIANTS_PER_MEAL_TYPE = 12;

export async function generateNutritionMenu({
  supabase,
  userId,
  profile,
  periodType,
  startDate,
  days,
  includeSnack = true,
  maxCandidatesPerMealType = MAX_CANDIDATES_PER_MEAL_TYPE,
  maxVariantsPerMealType = MAX_VARIANTS_PER_MEAL_TYPE,
  logger,
}: GenerateNutritionMenuParams): Promise<GeneratedMenuResult> {
  const targets = profileTargetsFromProfile(profile);
  const { candidatesByMealType, excludedCandidates } = await loadRecipeCandidates({
    supabase,
    userId,
    maxCandidatesPerMealType,
    logger,
  });

  return generateNutritionMenuFromCandidates({
    targets,
    periodType,
    startDate,
    days,
    candidatesByMealType,
    excludedCandidates,
    includeSnack,
    maxCandidatesPerMealType,
    maxVariantsPerMealType,
    logger,
  });
}

export async function loadRecipeCandidates({
  supabase,
  userId,
  maxCandidatesPerMealType = MAX_CANDIDATES_PER_MEAL_TYPE,
  logger,
}: {
  supabase: SupabaseClientLike;
  userId: string;
  maxCandidatesPerMealType?: number;
  logger?: MenuGeneratorLogger;
}): Promise<{
  candidatesByMealType: RecipeCandidatesByMealType;
  excludedCandidates: ExcludedRecipeCandidate[];
}> {
  const { data, error } = await supabase
    .from("dishes")
    .select(
      "id,name,meal_type,servings,tags,recipe_status,is_special,recipe_ingredients(id,ingredient_id,name,quantity,unit_type,is_confirmed,ingredients(id,name,nutrition_status,kcal_per_100g,protein_per_100g,carbs_per_100g,fat_per_100g))",
    )
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (error) throw error;

  const candidatesByMealType = cloneEmptyCandidates();
  const excludedCandidates: ExcludedRecipeCandidate[] = [];

  for (const row of data || []) {
    const built = buildRecipeCandidate(row);
    if ("reason" in built) {
      excludedCandidates.push(built);
      continue;
    }
    candidatesByMealType[built.mealType].push(built);
  }

  for (const mealType of Object.keys(candidatesByMealType) as MealType[]) {
    candidatesByMealType[mealType] = candidatesByMealType[mealType]
      .sort(compareCandidates)
      .slice(0, maxCandidatesPerMealType);
  }

  await logger?.({
    level: "info",
    step: "recipe_candidates",
    message: "Nutrition generator recipe candidates loaded.",
    metadata: {
      by_meal_type: candidateCounts(candidatesByMealType),
      excluded_count: excludedCandidates.length,
    },
  });

  return { candidatesByMealType, excludedCandidates };
}

export function buildRecipeCandidate(row: any): RecipeCandidate | ExcludedRecipeCandidate {
  const recipeId = String(row?.id || "");
  const name = String(row?.name || "Receta");
  const mealType = normalizeMealType(row?.meal_type);

  if (!mealType) {
    return { recipeId, name, reason: "missing_meal_type" };
  }
  if (row?.is_special) {
    return { recipeId, name, reason: "special_recipe" };
  }
  if (row?.recipe_status && row.recipe_status !== "complete") {
    return { recipeId, name, reason: "not_complete" };
  }

  const macroCalculation = calculateRecipeMacros(row?.recipe_ingredients || []);
  if (!macroCalculation.complete) {
    return {
      recipeId,
      name,
      reason: "macro_calculation_failed",
      issues: macroCalculation.issues,
    };
  }

  return {
    recipeId,
    name,
    mealType,
    servings: Math.max(1, Number(row?.servings || 1)),
    tags: Array.isArray(row?.tags) ? row.tags.map(String).filter(Boolean) : [],
    totals: macroCalculation.totals,
    ingredients: macroCalculation.ingredientContributions,
  };
}

export function generateNutritionMenuFromCandidates({
  targets,
  periodType,
  startDate,
  days,
  candidatesByMealType,
  excludedCandidates,
  includeSnack = true,
  maxCandidatesPerMealType = MAX_CANDIDATES_PER_MEAL_TYPE,
  maxVariantsPerMealType = MAX_VARIANTS_PER_MEAL_TYPE,
  logger,
}: GeneratePeriodParams): GeneratedMenuResult {
  const targetDays = resolvePeriodDays(periodType, days);
  const selectedDays: GeneratedMenuDay[] = [];
  let previousRecipeIds: string[] = [];

  for (let index = 0; index < targetDays; index++) {
    const day = generateDailyMenu({
      dayIndex: index + 1,
      dayDate: addDays(startDate, index),
      targets,
      candidatesByMealType,
      previousRecipeIds,
      includeSnack,
      maxCandidatesPerMealType,
      maxVariantsPerMealType,
    });
    selectedDays.push(day);
    previousRecipeIds = day.meals.map((meal) => meal.recipeId);
  }

  const summary = summarizePeriod(selectedDays);
  void logger?.({
    level: summary.compliantDays === selectedDays.length ? "info" : "warn",
    step: "period_generation",
    message: "Nutrition generator period generated.",
    metadata: {
      period_type: periodType,
      days_count: selectedDays.length,
      global_score: summary.globalScore,
      compliant_days: summary.compliantDays,
    },
  });

  return {
    periodType,
    targets,
    days: selectedDays,
    summary,
    candidates: {
      byMealType: candidateCounts(candidatesByMealType),
      excluded: excludedCandidates,
    },
  };
}

export function generateDailyMenu({
  dayIndex,
  dayDate,
  targets,
  candidatesByMealType,
  previousRecipeIds = [],
  includeSnack = true,
  maxCandidatesPerMealType = MAX_CANDIDATES_PER_MEAL_TYPE,
  maxVariantsPerMealType = MAX_VARIANTS_PER_MEAL_TYPE,
}: {
  dayIndex: number;
  dayDate: string;
  targets: ProfileNutritionTargets;
  candidatesByMealType: RecipeCandidatesByMealType;
  previousRecipeIds?: string[];
  includeSnack?: boolean;
  maxCandidatesPerMealType?: number;
  maxVariantsPerMealType?: number;
}): GeneratedMenuDay {
  const mealTypes = resolveRequiredMealTypes(candidatesByMealType, includeSnack);
  const variantsByMealType = mealTypes.map((mealType) =>
    buildCandidateVariants({
      mealType,
      candidates: candidatesByMealType[mealType] || [],
      targets,
      includeSnack: mealTypes.includes("snack"),
      maxCandidatesPerMealType,
      maxVariantsPerMealType,
    }),
  );

  for (const index of variantsByMealType.keys()) {
    if ((variantsByMealType[index] || []).length === 0) {
      throw new Error(`No recipe candidates available for ${mealTypes[index]}`);
    }
  }

  const combinations = cartesianProduct(variantsByMealType);
  const options = combinations.map((variants): DailyCombinationOption => {
    const meals = variants.map(variantToMeal);
    const totals = meals.reduce(
      (acc, meal) => addNutritionTotals(acc, meal.totals),
      { ...EMPTY_NUTRITION_TOTALS },
    );
    const repeatedRecipeIds = meals
      .map((meal) => meal.recipeId)
      .filter((recipeId) => previousRecipeIds.includes(recipeId));
    const diagnostics = scoreMenu({
      totals,
      targets,
      repeatedRecipeIds,
      tags: meals.flatMap((meal) => meal.tags),
    });

    return {
      meals,
      totals,
      diagnostics,
      score: diagnostics.score,
      tieBreaker: meals
        .map((meal) => `${meal.mealType}:${meal.recipeId}:${meal.servingMultiplier}`)
        .join("|"),
    };
  });

  const best = selectBestScoredOption(options);
  if (!best) throw new Error("No daily menu combinations could be generated.");

  return {
    dayIndex,
    dayDate,
    meals: best.meals,
    totals: best.totals,
    score: best.score,
    meetsTargets: best.diagnostics.meetsTargets,
    diagnostics: best.diagnostics,
  };
}

function buildCandidateVariants({
  mealType,
  candidates,
  targets,
  includeSnack,
  maxCandidatesPerMealType,
  maxVariantsPerMealType,
}: {
  mealType: MealType;
  candidates: RecipeCandidate[];
  targets: ProfileNutritionTargets;
  includeSnack: boolean;
  maxCandidatesPerMealType: number;
  maxVariantsPerMealType: number;
}): CandidateVariant[] {
  const targetShare = targetShareForMeal(mealType, includeSnack);
  const mealTargetKcal = targets.targetKcal * targetShare.kcal;
  const mealTargetProtein = targets.targetProteinG * targetShare.protein;

  return candidates
    .slice(0, maxCandidatesPerMealType)
    .flatMap((candidate) =>
      SERVING_MULTIPLIERS.map((multiplier) => {
        const totals = scaleNutritionTotals(candidate.totals, multiplier);
        return {
          candidate,
          multiplier,
          totals,
          compatibilityScore:
            Math.abs(totals.kcal - mealTargetKcal) +
            Math.abs(totals.proteinG - mealTargetProtein) * 4,
          tieBreaker: `${candidate.recipeId}:${multiplier}`,
        };
      }),
    )
    .sort((left, right) => {
      const scoreDelta = left.compatibilityScore - right.compatibilityScore;
      if (scoreDelta !== 0) return scoreDelta;
      return left.tieBreaker.localeCompare(right.tieBreaker);
    })
    .slice(0, maxVariantsPerMealType);
}

function variantToMeal(variant: CandidateVariant): GeneratedMenuMeal {
  return {
    recipeId: variant.candidate.recipeId,
    name: variant.candidate.name,
    mealType: variant.candidate.mealType,
    servingMultiplier: variant.multiplier,
    totals: variant.totals,
    tags: variant.candidate.tags,
  };
}

function summarizePeriod(days: GeneratedMenuDay[]): GeneratedMenuPeriodSummary {
  const totalScore = days.reduce((acc, day) => acc + day.score, 0);
  const totalMacros = days.reduce(
    (acc, day) => addNutritionTotals(acc, day.totals),
    { ...EMPTY_NUTRITION_TOTALS },
  );
  const divisor = Math.max(1, days.length);

  return {
    daysCount: days.length,
    globalScore: round(totalScore, 4),
    averageScore: round(totalScore / divisor, 4),
    averageTotals: scaleNutritionTotals(totalMacros, 1 / divisor),
    compliantDays: days.filter((day) => day.meetsTargets).length,
  };
}

function resolveRequiredMealTypes(
  candidatesByMealType: RecipeCandidatesByMealType,
  includeSnack: boolean,
): MealType[] {
  const mealTypes: MealType[] = ["desayuno", "comida", "cena"];
  if (includeSnack && candidatesByMealType.snack.length > 0) mealTypes.push("snack");
  return mealTypes;
}

function targetShareForMeal(
  mealType: MealType,
  includeSnack: boolean,
): { kcal: number; protein: number } {
  if (includeSnack) {
    if (mealType === "desayuno") return { kcal: 0.2, protein: 0.25 };
    if (mealType === "comida") return { kcal: 0.35, protein: 0.35 };
    if (mealType === "cena") return { kcal: 0.35, protein: 0.3 };
    return { kcal: 0.1, protein: 0.1 };
  }
  if (mealType === "desayuno") return { kcal: 0.25, protein: 0.3 };
  if (mealType === "comida") return { kcal: 0.4, protein: 0.4 };
  return { kcal: 0.35, protein: 0.3 };
}

function resolvePeriodDays(periodType: MenuPeriodType, days?: number): number {
  if (Number.isFinite(Number(days)) && Number(days) > 0) {
    return Math.min(31, Math.max(1, Math.round(Number(days))));
  }
  if (periodType === "daily") return 1;
  if (periodType === "weekly") return 7;
  return 30;
}

function addDays(startDate: string, offset: number): string {
  const date = new Date(startDate);
  if (Number.isNaN(date.getTime())) throw new Error("Invalid startDate.");
  date.setDate(date.getDate() + offset);
  return date.toISOString().split("T")[0] || startDate;
}

function normalizeMealType(value: unknown): MealType | null {
  const normalized = String(value || "").trim().toLowerCase();
  if (
    normalized === "desayuno" ||
    normalized === "comida" ||
    normalized === "cena" ||
    normalized === "snack"
  ) {
    return normalized;
  }
  return null;
}

function cartesianProduct<T>(arrays: T[][]): T[][] {
  return arrays.reduce<T[][]>(
    (acc, items) => acc.flatMap((prefix) => items.map((item) => [...prefix, item])),
    [[]],
  );
}

function cloneEmptyCandidates(): RecipeCandidatesByMealType {
  return {
    desayuno: [],
    comida: [],
    cena: [],
    snack: [],
  };
}

function candidateCounts(candidatesByMealType: RecipeCandidatesByMealType) {
  return {
    desayuno: candidatesByMealType.desayuno.length,
    comida: candidatesByMealType.comida.length,
    cena: candidatesByMealType.cena.length,
    snack: candidatesByMealType.snack.length,
  };
}

function compareCandidates(left: RecipeCandidate, right: RecipeCandidate): number {
  return left.name.localeCompare(right.name) || left.recipeId.localeCompare(right.recipeId);
}

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(Number(value || 0) * factor) / factor;
}
