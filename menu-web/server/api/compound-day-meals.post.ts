import { createSupabaseAdminClient } from "~/server/utils/supabase-admin";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const userId = body.userId;
  const name = body.name?.trim();
  const firstDishId = body.firstDishId;
  const secondDishId = body.secondDishId;

  if (!userId || !name || !firstDishId || !secondDishId) {
    throw createError({
      statusCode: 400,
      statusMessage: "userId, name, firstDishId y secondDishId son obligatorios",
    });
  }

  if (firstDishId === secondDishId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Los dos platos deben ser diferentes",
    });
  }

  const config = useRuntimeConfig(event);
  const supabase = createSupabaseAdminClient(config);

  const { data: existing, error: checkError } = await supabase
    .from("compound_day_meals")
    .select("id")
    .eq("user_id", userId)
    .eq("name", name)
    .maybeSingle();

  if (checkError) {
    throw createError({
      statusCode: 500,
      statusMessage: `Error verificando día compuesto: ${checkError.message}`,
    });
  }

  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: "Ya existe un día compuesto con ese nombre",
    });
  }

  const { data, error } = await supabase
    .from("compound_day_meals")
    .insert({
      user_id: userId,
      name,
      first_dish_id: firstDishId,
      second_dish_id: secondDishId,
    })
    .select()
    .single();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Error creando día compuesto: ${error.message}`,
    });
  }

  return {
    success: true,
    compoundDay: data,
  };
});