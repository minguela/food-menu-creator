import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const repositoryPath = new URL(
  "../layers/00.core/app/repositories.ts",
  import.meta.url,
);

test("menu repository uses the Neon weekly_menus table", async () => {
  const source = await readFile(repositoryPath, "utf8");

  assert.match(source, /const menus = tableQuery\(['"]weekly_menus['"]\)/);
});
