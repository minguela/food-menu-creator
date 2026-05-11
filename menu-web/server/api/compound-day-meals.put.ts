import { createSupabaseAdminClient } from "~/server/utils/supabase-admin";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const compoundDayId = body.id;
  const userId = body.userId;
  const name = body.name?.trim();
  const firstDishId = body.firstDishId;
  const secondDishId = body.secondDishId;

  if (!compoundDayId || !userId) {
    throw createError({
      statusCode: 400,
      statusMessage: "id y userId son obligatorios",
    });
  }

  if (firstDishId && secondDishId && firstDishId === secondDishId) {
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
    .eq("id", compoundDayId)
    .eq("user_id", userId)
    .maybeSingle();

  if (checkError) {
    throw createError({
      statusCode: 500,
      statusMessage: `Error verificando día compuesto: ${checkError.message}`,
    });
  }

  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: "Día compuesto no encontrado",
    });
  }

  if (name) {
    const { data: duplicate, error: dupError } = await supabase
      .from("compound_day_meals")
      .select("id")
      .eq("user_id", userId)
      .eq("name", name)
      .neq("id", compoundDayId)
      .maybeSingle();

    if (dupError) {
      throw createError({
        statusCode: 500,
        statusMessage: `Error verificando nombre: ${dupError.message}`,
      });
    }

    if (duplicate) {
      throw createError({
        statusCode: 409,
        statusMessage: "Ya existe otro día compuesto con ese nombre",
      });
    }
  }

  const updateData: Record<string, any> = {};
  if (name) updateData.name = name;
  if (firstDishId) updateData.first_dish_id = firstDishId;
  if (secondDishId) updateData.second_dish_id = secondDishId;

  const { data, error } = await supabase
    .from("compound_day_meals")
    .update(updateData)
    .eq("id", compoundDayId)
    .select()
    .single();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Error actualizando día compuesto: ${error.message}`,
    });
  }

  return {
    success: true,
    compoundDay: data,
  };
});