import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  try {
    const migrationSecret = Deno.env.get("MIGRATION_SHARED_SECRET");
    const providedSecret = req.headers.get("x-migration-secret") ?? "";

    if (!migrationSecret || providedSecret !== migrationSecret) {
      return new Response(
        JSON.stringify({ ok: false, error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const sql = `
      -- Tabla weekly_menus
      CREATE TABLE IF NOT EXISTS weekly_menus (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100),
        week_number INT DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, week_number)
      );

      CREATE INDEX IF NOT EXISTS idx_weekly_menus_user ON weekly_menus(user_id);

      -- Tabla weekly_meals
      CREATE TABLE IF NOT EXISTS weekly_meals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        weekly_menu_id UUID REFERENCES weekly_menus(id) ON DELETE CASCADE,
        day_number INT CHECK (day_number BETWEEN 1 AND 7),
        meal_type VARCHAR(10) CHECK (meal_type IN ('comida', 'cena')),
        dish_name VARCHAR(255) NOT NULL,
        dish_description TEXT,
        image_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_weekly_meals_menu ON weekly_meals(weekly_menu_id);
      CREATE INDEX IF NOT EXISTS idx_weekly_meals_day ON weekly_meals(weekly_menu_id, day_number, meal_type);
    `;

    // Ejecutar SQL usando la conexión directa del cliente
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Si rpc no existe, intentar con query directa
      console.error("RPC error:", error);
      return new Response(
        JSON.stringify({
          ok: false,
          error: error.message,
          hint: "Necesitas ejecutar el SQL manualmente desde el SQL Editor del dashboard"
        }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, message: "Migración aplicada correctamente" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 500 }
    );
  }
});
