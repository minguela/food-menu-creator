import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const { user_id, month, year } = await req.json();

    if (!user_id || !month || !year) {
      return new Response(
        JSON.stringify({ error: "user_id, month, and year required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`Generando menú para ${month}/${year} para usuario ${user_id}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // ============================================
    // Paso 1: Obtener configuración del usuario
    // ============================================
    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", user_id)
      .single();

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const dailyKcalTarget = user.daily_kcal_target || 1900;
    const dailyProteinTarget = user.daily_protein_target || 120;
    const macroValidation = validateMacroTargets(user.fat_pct_target || 30, user.carbs_pct_target || 45);

    if (!macroValidation.valid) {
      return new Response(
        JSON.stringify({ error: macroValidation.message }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // Paso 2: Obtener menús base disponibles
    // ============================================
    const { data: weeklyMenus } = await supabase
      .from("weekly_menus")
      .select("id, name, week_number, weekly_meals(*, weekly_meal_ingredients(*))")
      .eq("user_id", user_id)
      .order("week_number", { ascending: true });

    const hasWeeklyMenus = Boolean(weeklyMenus?.length);

    // Obtener días compuestos disponibles para el usuario
    const { data: compoundDays } = await supabase
      .from("compound_day_meals")
      .select(`
        id,
        name,
        first_dish:dishes!compound_day_meals_first_dish_id_fkey(
          id, name, kcal, protein_g, carbs_g, fat_g
        ),
        second_dish:dishes!compound_day_meals_second_dish_id_fkey(
          id, name, kcal, protein_g, carbs_g, fat_g
        )
      `)
      .eq("user_id", user_id);

    const availableCompoundDays = compoundDays || [];
    console.log(`Días compuestos disponibles: ${availableCompoundDays.length}`);
    let menuImages: any[] = [];
    let dishes: any[] = [];

    if (!hasWeeklyMenus && availableCompoundDays.length === 0) {
      const { data: legacyMenuImages } = await supabase
        .from("menu_images")
        .select("id, day_number, meal_type")
        .eq("user_id", user_id)
        .eq("processed", true);

      menuImages = legacyMenuImages || [];

      if (menuImages.length === 0) {
        return new Response(
          JSON.stringify({
            error: "No hay menús semanales, días compuestos ni menús legacy procesados para generar el mes.",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const { data: legacyDishes } = await supabase
        .from("dishes")
        .select("id, menu_image_id, kcal, protein_g, carbs_g, fat_g, name")
        .in(
          "menu_image_id",
          menuImages.map((m) => m.id)
        );

      dishes = legacyDishes || [];
    }

    // Usar días compuestos como fuente alternativa
    const useCompoundDays = !hasWeeklyMenus && availableCompoundDays.length > 0;
    if (useCompoundDays) {
      console.log(`Usando ${availableCompoundDays.length} días compuestos para generación`);
    }

    // ============================================
    // Paso 4: Calcular días del mes
    // ============================================
    const daysInMonth = new Date(year, month, 0).getDate();
    const startDate = new Date(year, month - 1, 1);

    // ============================================
    // Paso 5: Generar planificación rotativa
    // ============================================
    const mealPlans = [];
    const plannedWeeklyMeals = [];
    const errors = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(day);

      for (const mealType of ["desayuno", "comida", "cena"]) {
        const mealKcalTarget = dailyKcalTarget * mealWeight(mealType);
        const mealProteinTarget = dailyProteinTarget * mealWeight(mealType);

        if (hasWeeklyMenus) {
          const currentMenuIndex = Math.floor((day - 1) / 7) % weeklyMenus.length;
          const dayInWeek = ((day - 1) % 7) + 1;
          const menu = weeklyMenus[currentMenuIndex];
          const selectedMeal = (menu.weekly_meals || []).find(
            (m: any) => m.day_number === dayInWeek && m.meal_type === mealType
          );

          if (!selectedMeal) {
            errors.push(`Falta ${mealType} para ${menu.name} día ${dayInWeek}`);
            continue;
          }

          plannedWeeklyMeals.push({ ...selectedMeal, plan_day: day });
          mealPlans.push({
            user_id,
            plan_date: currentDate.toISOString().split("T")[0],
            meal_type: mealType,
            dish_id: null,
            day_original: dayInWeek,
            kcal: selectedMeal.kcal || mealKcalTarget,
            protein_g: selectedMeal.protein_g || mealProteinTarget,
          });

          continue;
        }

        const baseDayIndex = ((day - 1) % 21) + 1;
        if (mealType === "desayuno") {
          continue;
        }

        // Usar días compuestos si están disponibles
        if (useCompoundDays && availableCompoundDays.length > 0) {
          const compoundDayIndex = ((day - 1) % availableCompoundDays.length);
          const compoundDay = availableCompoundDays[compoundDayIndex];

          if (mealType === "comida") {
            mealPlans.push({
              user_id,
              plan_date: currentDate.toISOString().split("T")[0],
              meal_type: mealType,
              dish_id: compoundDay.first_dish?.id,
              day_original: day,
              compound_day_id: compoundDay.id,
              compound_day_name: compoundDay.name,
              kcal: compoundDay.first_dish?.kcal || mealKcalTarget,
              protein_g: compoundDay.first_dish?.protein_g || mealProteinTarget,
            });
          } else if (mealType === "cena") {
            mealPlans.push({
              user_id,
              plan_date: currentDate.toISOString().split("T")[0],
              meal_type: mealType,
              dish_id: compoundDay.second_dish?.id,
              day_original: day,
              compound_day_id: compoundDay.id,
              compound_day_name: compoundDay.name,
              kcal: compoundDay.second_dish?.kcal || mealKcalTarget,
              protein_g: compoundDay.second_dish?.protein_g || mealProteinTarget,
            });
          }
          continue;
        }

        const baseMenu = menuImages.find(
          (m) => m.day_number === baseDayIndex && m.meal_type === mealType
        );

        if (!baseMenu) {
          errors.push(`Falta ${mealType} para día base ${baseDayIndex}`);
          continue;
        }

        const menuDishes = dishes.filter((d) => d.menu_image_id === baseMenu.id);
        const selectedDish = menuDishes[0];

        mealPlans.push({
          user_id,
          plan_date: currentDate.toISOString().split("T")[0],
          meal_type: mealType,
          dish_id: selectedDish?.id,
          day_original: baseDayIndex,
          kcal: selectedDish?.kcal || mealKcalTarget,
          protein_g: selectedDish?.protein_g || mealProteinTarget,
        });
      }
    }

    if (hasWeeklyMenus) {
      for (let day = 1; day <= daysInMonth; day++) {
        const dayMeals = plannedWeeklyMeals.filter((meal: any) => meal.plan_day === day);
        const daily = summarizeMeals(dayMeals);
        const realized = macroPercentagesFromGrams(daily);

        if (daily.kcal > 0 && Math.abs(realized.fat_pct - (user.fat_pct_target || 30)) > 20) {
          errors.push(`Día ${day}: grasas ${realized.fat_pct}% lejos del objetivo ${user.fat_pct_target || 30}%`);
        }
        if (daily.kcal > 0 && Math.abs(realized.carbs_pct - (user.carbs_pct_target || 45)) > 20) {
          errors.push(`Día ${day}: hidratos ${realized.carbs_pct}% lejos del objetivo ${user.carbs_pct_target || 45}%`);
        }
      }
    }

    // ============================================
    // Paso 6: Insertar planificación en DB
    // ============================================
    // Eliminar planificación existente para este mes
    const monthStart = new Date(year, month - 1, 1).toISOString();
    const monthEnd = new Date(year, month, 0).toISOString();

    await supabase
      .from("meal_plans")
      .delete()
      .eq("user_id", user_id)
      .gte("plan_date", monthStart)
      .lte("plan_date", monthEnd);

    // Insertar nueva planificación
    const { data: insertedPlans, error: insertError } = await supabase
      .from("meal_plans")
      .insert(mealPlans)
      .select();

    if (insertError) {
      throw insertError;
    }

    // ============================================
    // Paso 7: Generar lista de la compra
    // ============================================
    const shoppingList = await generateShoppingList(
      supabase,
      user_id,
      insertedPlans,
      plannedWeeklyMeals,
      monthStart.split("T")[0]
    );

    await saveMonthlyMenuSnapshot(
      supabase,
      user_id,
      month,
      year,
      monthStart.split("T")[0],
      monthEnd.split("T")[0],
      insertedPlans || [],
      plannedWeeklyMeals,
      shoppingList.items || []
    );

    // ============================================
    // Paso 8: Notificar por Telegram
    // ============================================
    if (user.telegram_chat_id) {
      await sendTelegramNotification(
        user.telegram_chat_id,
        `✅ *Menú de ${month}/${year} generado*

📅 Días planificados: ${daysInMonth}
🍽️ Comidas: ${insertedPlans?.length || 0}

🛒 Lista de la compra generada con ${shoppingList.itemsCount} ingredientes.

Total estimado: ${shoppingList.totalCost.toFixed(2)}€

Usa /shopping para ver la lista completa.`
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        plans_count: insertedPlans?.length || 0,
        shopping_items: shoppingList.itemsCount,
        total_cost: shoppingList.totalCost,
        errors,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generando menú mensual:", error);
    await logError("web", error, "generate-monthly-menu.main");
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

// ============================================
// Generar lista de la compra consolidada
// ============================================
async function generateShoppingList(
  supabase: any,
  userId: string,
  mealPlans: any[],
  weeklyMeals: any[] = [],
  weekStart: string = new Date().toISOString().split("T")[0]
) {
  const consolidated: Record<string, { name: string; quantity: number; unit_type: string; conversion_status?: string; conversion_note?: string }> =
    {};

  // Obtener ingredientes de todos los platos legacy planificados.
  const dishIds = mealPlans
    .map((p) => p.dish_id)
    .filter((id) => id !== null);

  if (dishIds.length > 0) {
    const { data: dishIngredients } = await supabase
      .from("dish_ingredients")
      .select("ingredient_id, quantity, unit_type, dishes(name)")
      .in("dish_id", dishIds);

    for (const item of dishIngredients || []) {
      addIngredient(consolidated, item.ingredient_id, item.dishes?.name || "Ingrediente", item.quantity || 100, item.unit_type || "g");
    }
  }

  if (weeklyMeals.length > 0) {
    for (const meal of weeklyMeals) {
      for (const ingredient of meal.weekly_meal_ingredients || []) {
        const normalized = normalizeIngredientQuantity(ingredient.quantity, ingredient.unit_type, ingredient.name);
        const ingredientId = await getOrCreateIngredient(
          supabase,
          ingredient.name,
          normalized.unit_type
        );
        addIngredient(
          consolidated,
          ingredientId,
          ingredient.name,
          normalized.quantity,
          normalized.unit_type,
          normalized.conversion.status,
          normalized.conversion.note
        );
      }
    }
  }

  if (Object.keys(consolidated).length === 0) {
    return { itemsCount: 0, totalCost: 0 };
  }

  // Obtener configuración del usuario para cálculo nutricional
  const { data: userData } = await supabase
    .from("users")
    .select("daily_kcal_target, daily_protein_target, persons_count")
    .eq("id", userId)
    .single();

  const personsCount = userData?.persons_count || 2;

  // Factor base para 2 personas (ajustado, no doble exacto)
  const BASE_PERSON_FACTOR = 1.7;

  // Calcular factor dinámico basado en personas
  const personFactor = BASE_PERSON_FACTOR * (personsCount / 2);

  const shoppingItems = [];
  let totalCost = 0;

  for (const [ingredientId, data] of Object.entries(consolidated)) {
    const ingredientName = data.name;
    const adjustedQuantity = data.quantity * personFactor;

    // Obtener precio del ingrediente
    const { data: priceData } = await supabase
      .from("ingredient_prices")
      .select("price, unit_price")
      .eq("ingredient_id", ingredientId)
      .order("scraped_at", { ascending: false })
      .limit(1)
      .single();

    const estimatedPrice = priceData?.unit_price
      ? Number(priceData.unit_price) * Math.max(adjustedQuantity / 1000, 1)
      : priceData?.price || adjustedQuantity * 0.01; // Fallback hasta tener precios reales.
    totalCost += estimatedPrice;

    shoppingItems.push({
      user_id: userId,
      week_start: weekStart,
      ingredient_id: ingredientId,
      item_name: ingredientName,
      quantity_needed: adjustedQuantity,
      quantity_grams: adjustedQuantity,
      original_quantity: data.quantity,
      original_unit_type: data.unit_type,
      conversion_status: data.conversion_status || "exact",
      conversion_note: data.conversion_note || "Convertido automáticamente a gramos.",
      estimated_price: estimatedPrice,
      purchased: false,
    });
  }

  await supabase
    .from("shopping_lists")
    .delete()
    .eq("user_id", userId)
    .eq("week_start", weekStart);

  // Insertar items (upsert para no duplicar)
  for (const item of shoppingItems) {
    await supabase.from("shopping_lists").upsert(item, {
      onConflict: "user_id,week_start,ingredient_id",
    });
  }

    return {
      itemsCount: shoppingItems.length,
      totalCost,
      items: shoppingItems,
    };
}

function addIngredient(
  consolidated: Record<string, { name: string; quantity: number; unit_type: string; conversion_status?: string; conversion_note?: string }>,
  ingredientId: string,
  name: string,
  quantity: number,
  unitType: string,
  conversionStatus = "exact",
  conversionNote = "Convertido automáticamente a gramos."
) {
  if (!consolidated[ingredientId]) {
    consolidated[ingredientId] = { name, quantity: 0, unit_type: unitType || "g", conversion_status: conversionStatus, conversion_note: conversionNote };
  }
  consolidated[ingredientId].quantity += Number(quantity) || 100;
  if (conversionStatus === "ambiguous") {
    consolidated[ingredientId].conversion_status = conversionStatus;
    consolidated[ingredientId].conversion_note = conversionNote;
  }
}

async function getOrCreateIngredient(supabase: any, rawName: string, unitType: string) {
  const name = rawName.trim().toLowerCase();

  const { data: existing } = await supabase
    .from("ingredients")
    .select("id")
    .eq("name", name)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data: created, error } = await supabase
    .from("ingredients")
    .insert({ name, unit_type: unitType })
    .select("id")
    .single();

  if (error) throw error;
  return created.id;
}

function normalizeIngredientQuantity(quantity: number, unitType: string, name = "") {
  const conversion = convertToGrams(name, quantity, unitType);
  return { quantity: conversion.grams, unit_type: "g", conversion };
}

function convertToGrams(name: string, quantity: number, unitType: string) {
  const amount = Number(quantity) || 0;
  const unit = String(unitType || "g").toLowerCase();
  if (unit === "g") return gramResult(amount, "exact", "Ya estaba en gramos.");
  if (unit === "kg") return gramResult(amount * 1000, "exact", "Convertido desde kg.");

  if (unit === "ml" || unit === "l") {
    const ml = unit === "l" ? amount * 1000 : amount;
    const density = densityFor(name);
    return density.known
      ? gramResult(ml * density.gramsPerMl, "estimated", `Densidad usada: ${density.gramsPerMl} g/ml.`)
      : gramResult(ml, "ambiguous", "Densidad desconocida; se asume 1 g/ml hasta editar.");
  }

  if (["ud", "unidad", "pieza", "pack"].includes(unit)) {
    const piece = pieceWeightFor(name);
    return piece
      ? gramResult(amount * piece, "estimated", `Peso medio usado: ${piece} g por unidad.`)
      : gramResult(amount * 100, "ambiguous", "Unidad ambigua; se asume 100 g hasta editar.");
  }

  return gramResult(amount, "ambiguous", `Unidad "${unitType}" no reconocida.`);
}

function densityFor(name: string) {
  if (/aceite|oil/i.test(name)) return { known: true, gramsPerMl: 0.92 };
  if (/miel|honey/i.test(name)) return { known: true, gramsPerMl: 1.42 };
  if (/leche|milk|caldo|zumo|agua|vinagre|salsa/i.test(name)) return { known: true, gramsPerMl: 1 };
  if (/yogur|nata|crema/i.test(name)) return { known: true, gramsPerMl: 1.03 };
  return { known: false, gramsPerMl: 1 };
}

function pieceWeightFor(name: string) {
  const weights = [
    { match: /huevo/i, grams: 60 },
    { match: /cebolla/i, grams: 150 },
    { match: /ajo/i, grams: 5 },
    { match: /tomate/i, grams: 125 },
    { match: /pimiento/i, grams: 160 },
    { match: /zanahoria/i, grams: 75 },
    { match: /lechuga/i, grams: 300 },
    { match: /pan/i, grams: 250 },
    { match: /yogur/i, grams: 125 },
    { match: /fruta|manzana|pera|naranja/i, grams: 180 },
  ];
  return weights.find((entry) => entry.match.test(name))?.grams || null;
}

function gramResult(grams: number, status: string, note: string) {
  return {
    grams: Math.max(1, Math.round((Number(grams) || 0) * 10) / 10),
    status,
    note,
  };
}

async function saveMonthlyMenuSnapshot(
  supabase: any,
  userId: string,
  month: number,
  year: number,
  startDate: string,
  endDate: string,
  mealPlans: any[],
  weeklyMeals: any[],
  shoppingItems: any[]
) {
  const menuData = mealPlans.map((plan, index) => {
    const meal = weeklyMeals.find((item: any) =>
      item.plan_day === new Date(plan.plan_date).getDate() && item.meal_type === plan.meal_type
    );
    return {
      day: new Date(plan.plan_date).getDate(),
      date: plan.plan_date,
      menu_name: meal?.dish_name || plan.meal_type,
      [plan.meal_type]: meal?.dish_name || "No disponible",
      kcal: plan.kcal || 0,
      index,
    };
  });

  await supabase.from("monthly_menus").insert({
    user_id: userId,
    name: `Menú ${month}/${year}`,
    month,
    year,
    start_date: startDate,
    end_date: endDate,
    menu_data: menuData,
    shopping_list: shoppingItems,
  });
}

function mealWeight(mealType: string) {
  if (mealType === "desayuno") return 0.25;
  if (mealType === "comida") return 0.4;
  return 0.35;
}

function validateMacroTargets(fatPct: number, carbsPct: number) {
  const fat = Number(fatPct);
  const carbs = Number(carbsPct);
  const protein = 100 - fat - carbs;

  if (fat < 10 || carbs < 10 || protein < 10) {
    return {
      valid: false,
      proteinPct: protein,
      message: "Combinación de macros ilógica: grasas, hidratos y proteína deben tener al menos un 10%.",
    };
  }

  if (fat > 70 || carbs > 80 || protein > 50) {
    return {
      valid: false,
      proteinPct: protein,
      message: "Combinación de macros fuera de rango nutricional razonable.",
    };
  }

  return { valid: true, proteinPct: protein, message: "" };
}

function summarizeMeals(meals: any[]) {
  return meals.reduce(
    (total, meal) => ({
      kcal: total.kcal + (Number(meal.kcal) || 0),
      protein_g: total.protein_g + (Number(meal.protein_g) || 0),
      carbs_g: total.carbs_g + (Number(meal.carbs_g) || 0),
      fat_g: total.fat_g + (Number(meal.fat_g) || 0),
    }),
    { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  );
}

function macroPercentagesFromGrams(summary: any) {
  const proteinKcal = (Number(summary.protein_g) || 0) * 4;
  const carbsKcal = (Number(summary.carbs_g) || 0) * 4;
  const fatKcal = (Number(summary.fat_g) || 0) * 9;
  const total = proteinKcal + carbsKcal + fatKcal;

  if (total === 0) return { protein_pct: 0, carbs_pct: 0, fat_pct: 0 };

  return {
    protein_pct: Math.round((proteinKcal / total) * 1000) / 10,
    carbs_pct: Math.round((carbsKcal / total) * 1000) / 10,
    fat_pct: Math.round((fatKcal / total) * 1000) / 10,
  };
}

// ============================================
// Enviar notificación por Telegram
// ============================================
async function sendTelegramNotification(chatId: number, text: string) {
  const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");

  if (!TELEGRAM_BOT_TOKEN) {
    console.warn("TELEGRAM_BOT_TOKEN no configurado");
    return;
  }

  try {
    await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "Markdown",
        }),
      }
    );
  } catch (e) {
    console.error("Error enviando notificación Telegram:", e);
    await logError("telegram", e, "generate-monthly-menu.sendTelegramNotification");
  }
}

async function logError(
  source: "web" | "telegram" | "ocr",
  err: unknown,
  context?: string
) {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "string"
          ? err
          : JSON.stringify(err);
    const stackTrace = err instanceof Error ? err.stack ?? null : null;

    await fetch(`${supabaseUrl}/rest/v1/rpc/insert_error_log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        p_source: source,
        p_message: context ? `[${context}] ${message}` : message,
        p_stack_trace: stackTrace,
      }),
    });
  } catch (logErr) {
    console.error("Error guardando error log:", logErr);
  }
}
