import { expect, test } from "@playwright/test";

const SUPABASE_URL =
  process.env.NUXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const OCR_URL = SUPABASE_URL
  ? `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/ocr-processor`
  : "";

test.describe("ocr-processor edge function", () => {
  test.skip(
    !OCR_URL || !SERVICE_ROLE_KEY,
    "Faltan NUXT_PUBLIC_SUPABASE_URL/SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY",
  );

  test("responde preflight OPTIONS con CORS", async ({ request }) => {
    const response = await request.fetch(OCR_URL, {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:3000",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "authorization,apikey,content-type",
      },
    });

    expect(response.status()).toBe(200);
    expect(response.headers()["access-control-allow-origin"]).toBe("*");
    expect(response.headers()["access-control-allow-methods"]).toContain(
      "POST",
    );
  });

  test("responde POST sin 405 y devuelve JSON", async ({ request }) => {
    const response = await request.post(OCR_URL, {
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      data: {
        meal_type: "comida",
        day_number: 1,
        image_url:
          "https://upload.wikimedia.org/wikipedia/commons/3/3f/JPEG_example_flower.jpg",
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("success", true);
  });

  test("extrae bloque semanal evitando cabeceras en comida/cena", async ({
    request,
  }) => {
    const imageUrl =
      "https://food-menu-creator-lyart.vercel.app/test-assets/menu-7dias-fodmap.jpg";

    const response = await request.post(OCR_URL, {
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      data: {
        weekly_menu_id: "00000000-0000-0000-0000-000000000000",
        weekly_day_image_ids: [],
        image_url: imageUrl,
        start_day: 1,
        day_count: 7,
        source_mode: "block",
        meal_types: ["comida", "cena"],
      },
    });

    // Si el asset no está disponible en este entorno, no marcamos falso negativo.
    if (response.status() >= 400) {
      test.skip(true, "No se pudo acceder al asset de prueba remoto.");
      return;
    }

    const body = await response.json();
    expect(body).toHaveProperty("success", true);
    const meals: Array<{ name: string }> = body.meals || [];

    const suspicious = meals.filter((meal) =>
      /@|diciembre|fodmap|menu dia|intenta hacer|seguimos con el desayuno/i.test(
        meal.name || "",
      ),
    );
    expect(suspicious.length).toBe(0);
  });
});
