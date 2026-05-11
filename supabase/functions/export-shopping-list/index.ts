import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const format = normalizeFormat(url.searchParams.get("format"));
    const userId = String(url.searchParams.get("user_id") || "").trim();

    if (!userId) {
      return json({ error: "user_id parameter required" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: items, error } = await supabase
      .from("shopping_lists")
      .select(
        "item_name, quantity_needed, quantity_grams, original_unit_type, purchased, ingredients(name, carrefour_category, unit_type)",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    const rows = items || [];
    if (format === "csv") {
      return new Response(buildCsv(rows), {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/csv;charset=utf-8",
          "Content-Disposition": "attachment; filename=shopping-list.csv",
        },
      });
    }

    return new Response(buildText(rows), {
      headers: { ...corsHeaders, "Content-Type": "text/plain;charset=utf-8" },
    });
  } catch (error) {
    console.error("Export error:", error);
    return json({ error: "Internal server error" }, 500);
  }
});

function normalizeFormat(value: string | null) {
  return value === "csv" ? "csv" : "text";
}

function buildText(items: any[]) {
  if (items.length === 0) return "Shopping list is empty";
  return items
    .map((item) => {
      const name = item.item_name || item.ingredients?.name || "Artículo";
      const quantity = Math.round(Number(item.quantity_grams || item.quantity_needed || 0));
      return `${quantity} g ${name}`;
    })
    .join("\n");
}

function buildCsv(items: any[]) {
  const rows = [["ingredient", "quantity", "unit", "category"]];
  for (const item of items) {
    rows.push([
      item.item_name || item.ingredients?.name || "Artículo",
      Math.round(Number(item.quantity_grams || item.quantity_needed || 0)),
      "g",
      item.ingredients?.carrefour_category || "Otros",
    ]);
  }
  return rows.map((row) => row.map(csvEscape).join(",")).join("\n");
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function json(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
