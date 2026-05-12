import test from "node:test";
import assert from "node:assert/strict";
import {
  buildShoppingCsv,
  buildShoppingListText,
  convertToGrams,
} from "../utils/shopping-conversions.js";

test("converts weight units to grams exactly", () => {
  assert.deepEqual(
    convertToGrams({ name: "arroz", quantity: 1.5, unitType: "kg" }),
    {
      grams: 1500,
      status: "exact",
      note: "Convertido desde kg.",
    },
  );
});

test("converts liquid units with known density", () => {
  const result = convertToGrams({
    name: "aceite de oliva",
    quantity: 100,
    unitType: "ml",
  });

  assert.equal(result.grams, 92);
  assert.equal(result.status, "estimated");
  assert.match(result.note, /0.92/);
});

test("marks unknown pieces as ambiguous and editable", () => {
  const result = convertToGrams({
    name: "servilletas",
    quantity: 2,
    unitType: "pack",
  });

  assert.equal(result.grams, 200);
  assert.equal(result.status, "ambiguous");
  assert.match(result.note, /ambigua/);
});

test("exports shopping list as plain text and csv", () => {
  const items = [
    {
      item_name: "papel higiénico",
      quantity_grams: 500,
      purchased: false,
      conversion_status: "manual",
    },
    {
      ingredients: { name: "arroz", carrefour_category: "Despensa" },
      quantity_grams: 1000,
      purchased: true,
      conversion_status: "exact",
    },
  ];

  assert.match(buildShoppingListText(items), /500 g papel higiénico/);
  assert.match(buildShoppingCsv(items), /ingredient,quantity,unit,category/);
  assert.match(buildShoppingCsv(items), /arroz,1000,g,Despensa/);
});

test("escapes shopping csv values with commas and quotes", () => {
  const csv = buildShoppingCsv([
    {
      item_name: 'tomate, pera "premium"',
      quantity_grams: 250,
      ingredients: { carrefour_category: "Frutas, verduras" },
    },
  ]);

  assert.match(csv, /"tomate, pera ""premium""",250,g,"Frutas, verduras"/);
});

test("exports empty shopping list message", () => {
  assert.equal(buildShoppingListText([]), "Shopping list is empty");
  assert.equal(buildShoppingCsv([]), "ingredient,quantity,unit,category");
});
