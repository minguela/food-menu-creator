const baseUrlArgIndex = process.argv.indexOf("--base-url");
const baseUrl =
  (
    process.argv.find((arg) => arg.startsWith("--base-url=")) ||
    process.argv[baseUrlArgIndex + 1] ||
    ""
  ).split("=")[1] ||
  process.env.HEALTH_CHECK_BASE_URL ||
  "http://127.0.0.1:3000";

const routes = [
  {
    path: "/",
    expected: ["MenuPlanner", "Menús Semanales"],
  },
  {
    path: "/generar",
    expected: ["Generar Menú Rotativo"],
  },
  {
    path: "/shopping",
    expected: ["Lista de la Compra"],
  },
  {
    path: "/config",
    expected: ["Configuración"],
  },
  {
    path: "/history",
    expected: ["Histórico de menús mensuales"],
  },
];

const timeoutMs = Number(process.env.HEALTH_CHECK_TIMEOUT_MS || 15000);

async function main() {
  const failures = [];

  for (const route of routes) {
    const url = new URL(route.path, baseUrl).toString();
    const result = await fetchWithTimeout(url, timeoutMs);

    if (!result.ok) {
      failures.push(`${route.path}: HTTP ${result.status}`);
      continue;
    }

    const html = await result.text();
    const matched = route.expected.every((phrase) => html.includes(phrase));

    if (!matched) {
      failures.push(
        `${route.path}: missing expected content (${route.expected.join(", ")})`,
      );
    }
  }

  if (failures.length > 0) {
    console.error("Health-check failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log(`Health-check OK against ${baseUrl}`);
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "menu-web-health-check",
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

main().catch((error) => {
  console.error("Health-check crashed:");
  console.error(
    error instanceof Error ? error.stack || error.message : String(error),
  );
  process.exit(1);
});
