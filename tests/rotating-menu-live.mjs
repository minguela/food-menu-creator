import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { buildRotatingWeeklyMenuBlocks } from "../utils/rotating-weekly-menu-blocks.js";
import { validatePlannedDayCompleteness } from "../utils/rotating-menu-completeness.js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const weeklyMenuIds = String(process.env.ROTATING_TEST_WEEKLY_MENU_IDS || "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);
const initialWeeklyMenuId = String(
  process.env.ROTATING_TEST_INITIAL_WEEKLY_MENU_ID || "",
).trim();
const durationDays = Math.max(
  1,
  Math.min(90, Number(process.env.ROTATING_TEST_DURATION_DAYS || 28) || 28),
);

if (!supabaseUrl || !serviceRoleKey || weeklyMenuIds.length === 0) {
  console.log(
    "Skipping live rotating contrast. Set SUPABASE_URL or NUXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and ROTATING_TEST_WEEKLY_MENU_IDS.",
  );
  process.exit(0);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: weeklyMeals, error } = await supabase
  .from("weekly_meals")
  .select("id, weekly_menu_id, day_number, meal_type, meal_slot, dish_name")
  .in("weekly_menu_id", weeklyMenuIds)
  .order("weekly_menu_id", { ascending: true })
  .order("day_number", { ascending: true })
  .order("meal_type", { ascending: true })
  .order("meal_slot", { ascending: true });

if (error) throw error;

assert.ok((weeklyMeals || []).length > 0, "No weekly_meals found for live IDs");

const plannedDays = buildRotatingWeeklyMenuBlocks({
  meals: weeklyMeals || [],
  sourceWeeklyMenuIds: weeklyMenuIds,
  durationDays,
  initialWeeklyMenuId: initialWeeklyMenuId || null,
  rng: () => 0,
});
const diagnostics = validatePlannedDayCompleteness({
  plannedDayBlocks: plannedDays,
  sourceMeals: weeklyMeals || [],
});

assert.deepEqual(diagnostics, []);
console.log(
  `Live rotating contrast passed for ${plannedDays.length} days and ${weeklyMenuIds.length} weekly menus.`,
);
