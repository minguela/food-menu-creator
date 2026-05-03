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
});
