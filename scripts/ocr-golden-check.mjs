import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(process.cwd());
const fixturesPath = path.join(projectRoot, "ocr-golden-fixtures.json");
const fixtures = JSON.parse(fs.readFileSync(fixturesPath, "utf8"));

const OCR_URL = process.env.OCR_URL || "https://tceusgxbfpekjcthrrqu.supabase.co/functions/v1/ocr-processor";

const normalize = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const imageFiles = Object.keys(fixtures);

const loadImageAsBase64 = (fileName) => {
  const filePath = path.join(projectRoot, fileName);
  const raw = fs.readFileSync(filePath);
  return raw.toString("base64");
};

const toActualMap = (meals) => {
  const map = {};
  for (const meal of meals || []) {
    const day = String(meal.day_number);
    const type = meal.meal_type;
    if (!map[day]) map[day] = { comida: [], cena: [] };
    if (!map[day][type]) map[day][type] = [];
    map[day][type].push(String(meal.name || "").trim());
  }
  for (const day of Object.keys(map)) {
    map[day].comida = map[day].comida.filter(Boolean);
    map[day].cena = map[day].cena.filter(Boolean);
  }
  return map;
};

let totalChecks = 0;
let totalExact = 0;

for (const imageName of imageFiles) {
  const payload = {
    image_base64: loadImageAsBase64(imageName),
    mime_type: "image/png",
    start_day: 1,
    day_count: 7,
    source_mode: "block",
    meal_types: ["comida", "cena"],
  };

  const response = await fetch(OCR_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = await response.json();
  if (!response.ok || !body?.success) {
    console.log(`\n=== ${imageName} ===`);
    console.log(`ERROR: ${body?.error || response.status}`);
    continue;
  }

  const actual = toActualMap(body.meals || []);
  const expected = fixtures[imageName];

  console.log(`\n=== ${imageName} ===`);
  for (let day = 1; day <= 7; day++) {
    const d = String(day);
    const expComida = expected[d]?.comida || [];
    const expCena = expected[d]?.cena || [];
    const actComida = actual[d]?.comida || [];
    const actCena = actual[d]?.cena || [];

    const compare = (label, exp, act) => {
      const max = Math.max(exp.length, act.length);
      for (let i = 0; i < max; i++) {
        const e = exp[i] || "";
        const a = act[i] || "";
        const ok = normalize(e) === normalize(a);
        totalChecks += 1;
        if (ok) totalExact += 1;
        const status = ok ? "OK" : "ERR";
        console.log(
          `D${d} ${label} S${i + 1} [${status}] expected="${e}" actual="${a}"`,
        );
      }
    };

    compare("comida", expComida, actComida);
    compare("cena", expCena, actCena);
  }
}

const accuracy = totalChecks > 0 ? ((totalExact / totalChecks) * 100).toFixed(2) : "0.00";
console.log(`\nAccuracy exacta (normalizada): ${totalExact}/${totalChecks} = ${accuracy}%`);
