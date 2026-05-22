import { promises as fs } from "node:fs";
import path from "node:path";

const root = process.cwd();
const scanDirs = ["app/pages", "app/components", "app/composables", "server", "utils"];
const includeExt = new Set([".vue", ".ts", ".js", ".mjs"]);
const patterns = [/\bwindow\.confirm\s*\(/, /\bconfirm\s*\(/];

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

for (const relDir of scanDirs) {
  const absDir = path.join(root, relDir);
  let files = [];
  try {
    files = await walk(absDir);
  } catch {
    continue;
  }

  for (const filePath of files) {
    const source = await fs.readFile(filePath, "utf8");
    const lines = source.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (line.includes("confirm-check-ignore")) return;
      if (patterns.some((pattern) => pattern.test(line))) {
        failures.push({
          file: path.relative(root, filePath),
          line: index + 1,
          content: line.trim(),
        });
      }
    });
  }
}

if (failures.length > 0) {
  console.error("Browser confirm usage detected:");
  failures.slice(0, 200).forEach((item) => {
    console.error(`- ${item.file}:${item.line} -> ${item.content}`);
  });
  process.exit(1);
}

console.log("No browser confirm usage found.");
