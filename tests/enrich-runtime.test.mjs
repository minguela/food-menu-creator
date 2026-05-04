import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeEnrichSource,
  resolveSupabaseServerKey,
  resolveUsdaKey,
  shouldTryOff,
  shouldTryUsda,
} from "../utils/enrich-runtime.js";

test("normalizes requested enrichment source safely", () => {
  assert.equal(normalizeEnrichSource("usda"), "usda");
  assert.equal(normalizeEnrichSource("open_food_facts"), "open_food_facts");
  assert.equal(normalizeEnrichSource("bedca"), "bedca");
  assert.equal(normalizeEnrichSource("anything-else"), "auto");
  assert.equal(normalizeEnrichSource(""), "auto");
});

test("resolves USDA key from runtime or env fallbacks", () => {
  assert.equal(
    resolveUsdaKey({
      runtimeUsdaKey: "",
      envUsdaFdc: "fdc",
      envUsdaLegacy: "",
      envNuxtUsda: "",
    }),
    "fdc",
  );
  assert.equal(
    resolveUsdaKey({
      runtimeUsdaKey: "",
      envUsdaFdc: "",
      envUsdaLegacy: "legacy",
      envNuxtUsda: "",
    }),
    "legacy",
  );
});

test("resolves supabase key with service-role priority and anon fallback", () => {
  assert.equal(
    resolveSupabaseServerKey({
      runtimeServiceKey: "runtime",
      envServiceRole: "env",
      envNuxtServiceKey: "nuxt",
      envSupabaseKey: "supabase",
      publicAnonKey: "anon",
    }),
    "runtime",
  );
  assert.equal(
    resolveSupabaseServerKey({
      runtimeServiceKey: "",
      envServiceRole: "",
      envNuxtServiceKey: "",
      envSupabaseKey: "",
      publicAnonKey: "anon",
    }),
    "anon",
  );
});

test("source toggles call routing correctly", () => {
  assert.equal(shouldTryUsda("usda"), true);
  assert.equal(shouldTryUsda("auto"), true);
  assert.equal(shouldTryUsda("open_food_facts"), false);
  assert.equal(shouldTryOff("open_food_facts"), true);
  assert.equal(shouldTryOff("auto"), true);
  assert.equal(shouldTryOff("usda"), false);
});
