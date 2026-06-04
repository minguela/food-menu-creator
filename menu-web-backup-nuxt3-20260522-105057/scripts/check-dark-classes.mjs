import { promises as fs } from "node:fs";
import path from "node:path";

const root = process.cwd();
const targets = ["pages", "components"];
const includeExt = new Set([".vue"]);
const forbiddenTokens = [
  "bg-white",
  "bg-gray-50",
  "bg-gray-100",
  "bg-slate-50",
  "bg-slate-100",
  "dark:",
  "text-gray-900",
  "text-gray-800",
  "text-gray-700",
  "text-gray-600",
  "text-gray-500",
  "text-slate-900",
  "text-slate-800",
  "border-gray-200",
  "border-gray-300",
  "border-slate-200",
  "border-slate-300",
];

const walk = async (dir) => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
      continue;
    }
    if (includeExt.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
};

const failures = [];

for (const target of targets) {
  const targetDir = path.join(root, target);
  let files = [];
  try {
    files = await walk(targetDir);
  } catch {
    continue;
  }

  for (const filePath of files) {
    const raw = await fs.readFile(filePath, "utf8");
    const lines = raw.split(/\r?\n/);
    lines.forEach((line, idx) => {
      if (!line.includes("class=")) return;
      if (line.includes("dark-check-ignore")) return;
      if (!forbiddenTokens.some((token) => line.includes(token))) return;
      failures.push({
        filePath,
        line: idx + 1,
        content: line.trim(),
      });
    });
  }
}

if (failures.length > 0) {
  console.error("Theme contract audit failed. Forbidden classes found:");
  failures.slice(0, 200).forEach((item) => {
    console.error(`- ${path.relative(root, item.filePath)}:${item.line} -> ${item.content}`);
  });
  process.exit(1);
}

console.log("Dark class audit passed.");
