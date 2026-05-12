export const saveIngredientFromCandidate = async (candidate: unknown) => {
  return await $fetch<{
    success: boolean;
    ingredient_id: string;
    strategy: "source_external_id" | "normalized_name";
  }>("/api/ingredients-save-candidate", {
    method: "POST",
    body: { candidate },
  });
};
