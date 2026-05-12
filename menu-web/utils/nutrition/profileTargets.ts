import type { PersonProfile } from "~/types";
import { roundNutrition } from "./calculateRecipeMacros";

export const DEFAULT_TOLERANCE_PERCENT = 10;
export const MIN_TOLERANCE_PERCENT = 0;
export const MAX_TOLERANCE_PERCENT = 50;

export type NutritionProfileInput = Partial<
  Pick<
    PersonProfile,
    | "id"
    | "name"
    | "daily_kcal_target"
    | "daily_protein_target"
    | "fat_pct_target"
    | "carbs_pct_target"
    | "protein_pct_target"
    | "tolerance_percent"
  >
> & {
  daily_protein_target_g?: number | null;
  daily_carbs_percent?: number | null;
  daily_fat_percent?: number | null;
};

export type TargetBounds = {
  min: number;
  max: number;
};

export type ProfileNutritionTargets = {
  profileId?: string;
  profileName?: string;
  targetKcal: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatG: number;
  carbsPercent: number;
  fatPercent: number;
  proteinPercent: number;
  tolerancePercent: number;
  bounds: {
    kcal: TargetBounds;
    proteinG: TargetBounds;
    carbsG: TargetBounds;
    fatG: TargetBounds;
  };
};

export class ProfileTargetValidationError extends Error {
  errors: string[];

  constructor(errors: string[]) {
    super(errors.join(" "));
    this.name = "ProfileTargetValidationError";
    this.errors = errors;
  }
}

export function profileTargetsFromProfile(
  profile: NutritionProfileInput,
): ProfileNutritionTargets {
  const normalized = normalizeProfileInput(profile);
  const errors = validateProfileTargets(normalized);
  if (errors.length > 0) {
    throw new ProfileTargetValidationError(errors);
  }

  const targetKcal = Number(normalized.daily_kcal_target);
  const carbsPercent = Number(
    normalized.carbs_pct_target ?? normalized.daily_carbs_percent,
  );
  const fatPercent = Number(
    normalized.fat_pct_target ?? normalized.daily_fat_percent,
  );
  const proteinPercent = Number(
    normalized.protein_pct_target ?? 100 - carbsPercent - fatPercent,
  );
  const tolerancePercent = resolveTolerancePercent(
    normalized.tolerance_percent,
  );

  const derivedProteinG = roundNutrition(
    (targetKcal * proteinPercent) / 100 / 4,
  );
  const targetProteinG = Number(
    normalized.daily_protein_target ?? normalized.daily_protein_target_g ?? derivedProteinG,
  );
  const targetCarbsG = roundNutrition((targetKcal * carbsPercent) / 100 / 4);
  const targetFatG = roundNutrition((targetKcal * fatPercent) / 100 / 9);

  return {
    profileId: normalized.id,
    profileName: normalized.name,
    targetKcal,
    targetProteinG,
    targetCarbsG,
    targetFatG,
    carbsPercent,
    fatPercent,
    proteinPercent,
    tolerancePercent,
    bounds: {
      kcal: toleranceBounds(targetKcal, tolerancePercent),
      proteinG: {
        min: lowerToleranceBound(targetProteinG, tolerancePercent),
        max: Number.POSITIVE_INFINITY,
      },
      carbsG: toleranceBounds(targetCarbsG, tolerancePercent),
      fatG: toleranceBounds(targetFatG, tolerancePercent),
    },
  };
}

export function validateProfileTargets(
  profile: NutritionProfileInput,
): string[] {
  const errors: string[] = [];
  const targetKcal = Number(profile.daily_kcal_target);
  const carbsPercent = Number(
    profile.carbs_pct_target ?? profile.daily_carbs_percent,
  );
  const fatPercent = Number(
    profile.fat_pct_target ?? profile.daily_fat_percent,
  );
  const proteinPercent = Number(
    profile.protein_pct_target ?? 100 - carbsPercent - fatPercent,
  );
  const tolerancePercent = resolveTolerancePercent(profile.tolerance_percent);

  if (!Number.isFinite(targetKcal) || targetKcal <= 0) {
    errors.push("daily_kcal_target must be a positive number.");
  }
  if (!Number.isFinite(carbsPercent) || carbsPercent <= 0) {
    errors.push("carbs percentage must be positive.");
  }
  if (!Number.isFinite(fatPercent) || fatPercent <= 0) {
    errors.push("fat percentage must be positive.");
  }
  if (!Number.isFinite(proteinPercent) || proteinPercent <= 0) {
    errors.push("protein percentage must be positive.");
  }
  if (
    Number.isFinite(carbsPercent + fatPercent + proteinPercent) &&
    Math.round(carbsPercent + fatPercent + proteinPercent) !== 100
  ) {
    errors.push("carbs, fat, and protein percentages must total exactly 100.");
  }
  if (proteinPercent < 5 || proteinPercent > 50) {
    errors.push("protein percentage must be between 5 and 50.");
  }
  if (
    !Number.isFinite(tolerancePercent) ||
    tolerancePercent < MIN_TOLERANCE_PERCENT ||
    tolerancePercent > MAX_TOLERANCE_PERCENT
  ) {
    errors.push(
      `tolerance_percent must be between ${MIN_TOLERANCE_PERCENT} and ${MAX_TOLERANCE_PERCENT}.`,
    );
  }
  if (
    Number.isFinite(targetKcal) &&
    Number.isFinite(proteinPercent) &&
    ((targetKcal * proteinPercent) / 100 / 4) * 4 >= targetKcal
  ) {
    errors.push("protein calories must be lower than daily kcal target.");
  }

  return errors;
}

export function resolveTolerancePercent(value?: number | null): number {
  const tolerance = Number(value ?? DEFAULT_TOLERANCE_PERCENT);
  if (!Number.isFinite(tolerance)) return DEFAULT_TOLERANCE_PERCENT;
  return roundNutrition(tolerance);
}

export function toleranceBounds(
  target: number,
  tolerancePercent: number,
): TargetBounds {
  return {
    min: lowerToleranceBound(target, tolerancePercent),
    max: upperToleranceBound(target, tolerancePercent),
  };
}

export function lowerToleranceBound(
  target: number,
  tolerancePercent: number,
): number {
  return roundNutrition(Number(target || 0) * (1 - Number(tolerancePercent || 0) / 100));
}

export function upperToleranceBound(
  target: number,
  tolerancePercent: number,
): number {
  return roundNutrition(Number(target || 0) * (1 + Number(tolerancePercent || 0) / 100));
}

function normalizeProfileInput(
  profile: NutritionProfileInput,
): NutritionProfileInput {
  return {
    ...profile,
    tolerance_percent: resolveTolerancePercent(profile.tolerance_percent),
  };
}
