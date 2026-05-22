export type CaloricDensityLevel =
  | "very_low"
  | "low"
  | "normal"
  | "caloric"
  | "very_caloric";

export const classifyCaloricDensity = (
  kcalPer100g: number | null | undefined,
): CaloricDensityLevel | null => {
  if ( kcalPer100g == null || !Number.isFinite( Number( kcalPer100g ) ) ) return null;
  const kcal = Number( kcalPer100g );
  if ( kcal < 0 ) return null;
  if ( kcal < 50 ) return "very_low";
  if ( kcal < 100 ) return "low";
  if ( kcal <= 200 ) return "normal";
  if ( kcal <= 400 ) return "caloric";
  return "very_caloric";
};

export const caloricDensityLabel = (
  level: CaloricDensityLevel | null | undefined,
) => {
  if ( level === "very_low" ) return "muy poco calorico";
  if ( level === "low" ) return "poco calorico";
  if ( level === "normal" ) return "normal";
  if ( level === "caloric" ) return "calorico";
  if ( level === "very_caloric" ) return "muy calorico";
  return "sin clasificar";
};
