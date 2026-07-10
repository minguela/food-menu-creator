<template>
  <div class="seasonal-ingredients ui-surface rounded-lg p-6 shadow-sm space-y-5">
    <!-- Header con selector de mes -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-xl font-bold ui-title">Ingredientes de Temporada</h2>
        <p class="text-sm ui-subtle">
          Descubre qué ingredientes están en su mejor momento este mes.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button
          class="ui-btn-muted rounded-md px-3 py-1.5 text-sm font-medium"
          @click="previousMonth"
        >
          ◀
        </button>
        <select
          v-model.number="selectedMonth"
          class="ui-select rounded-md px-3 py-2 text-sm font-semibold min-w-[140px]"
          @change="onMonthChanged"
        >
          <option v-for="(name, idx) in monthNames" :key="idx" :value="idx">
            {{ name }}
          </option>
        </select>
        <button
          class="ui-btn-muted rounded-md px-3 py-1.5 text-sm font-medium"
          @click="nextMonth"
        >
          ▶
        </button>
        <button
          v-if="selectedMonth !== currentMonth"
          class="ui-btn-muted rounded-md px-3 py-1.5 text-xs"
          @click="resetToCurrentMonth"
        >
          Hoy
        </button>
      </div>
    </div>

    <!-- Indicador de estación -->
    <div class="flex items-center gap-3">
      <span
        class="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium"
        :class="seasonBadgeClass"
      >
        <span>{{ seasonEmoji }}</span>
        <span>{{ seasonName }}</span>
      </span>
      <span class="text-xs ui-subtle">
        {{ seasonDescription }}
      </span>
    </div>

    <!-- Vista por categorías -->
    <div class="space-y-5">
      <section v-for="category in categories" :key="category.key">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-lg">{{ category.emoji }}</span>
          <h3 class="font-semibold ui-muted">{{ category.label }}</h3>
          <span class="rounded-full bg-[var(--color-surface-3)] px-2 py-0.5 text-xs ui-subtle">
            {{ category.items.length }}
          </span>
        </div>

        <div v-if="category.items.length > 0" class="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="item in category.items"
            :key="item.name"
            class="group rounded-lg border ui-divider p-3 hover:border-[var(--color-accent)] transition-colors cursor-default"
            :class="item.peak ? 'border-emerald-700/50 bg-emerald-950/20' : ''"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0 flex-1">
                <p class="font-medium ui-muted truncate">
                  {{ item.name }}
                  <span
                    v-if="item.peak"
                    class="ml-1 inline-block rounded-full bg-emerald-700 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-200"
                  >
                    PICO
                  </span>
                </p>
                <p class="text-xs ui-subtle mt-0.5">
                  {{ item.tip }}
                </p>
              </div>
              <div class="flex flex-col items-end gap-1 text-[10px] ui-subtle shrink-0">
                <span
                  v-if="item.kcal_per_100g"
                  class="rounded bg-[var(--color-surface-3)] px-1.5 py-0.5"
                >
                  {{ item.kcal_per_100g }} kcal
                </span>
                <span
                  v-if="item.months_count > 1"
                  class="rounded bg-[var(--color-surface-3)] px-1.5 py-0.5"
                >
                  {{ item.months_count }} meses
                </span>
              </div>
            </div>
          </div>
        </div>

        <p v-else class="text-sm ui-subtle pl-7">
          No hay ingredientes de esta categoría en {{ monthNames[selectedMonth] }}.
        </p>
      </section>
    </div>

    <!-- Consejos de la estación -->
    <section class="rounded-lg border ui-divider p-4 space-y-2">
      <h3 class="font-semibold ui-muted text-sm">💡 Consejos para {{ monthNames[selectedMonth] }}</h3>
      <ul class="space-y-1 text-sm ui-subtle">
        <li v-for="(tip, idx) in seasonalTips" :key="idx" class="flex gap-2">
          <span class="text-indigo-300">▸</span>
          <span>{{ tip }}</span>
        </li>
      </ul>
    </section>

    <!-- Calendario rápido de meses -->
    <details class="rounded-lg border ui-divider p-4">
      <summary class="font-semibold ui-muted text-sm cursor-pointer">
        📅 Vista rápida de todos los meses
      </summary>
      <div class="mt-3 grid gap-1.5" style="grid-template-columns: repeat(auto-fill, minmax(220px, 1fr))">
        <button
          v-for="(name, idx) in monthNames"
          :key="idx"
          class="rounded px-3 py-2 text-left text-sm transition-colors"
          :class="idx === selectedMonth
            ? 'bg-[var(--color-accent-soft)] font-semibold text-indigo-200'
            : 'hover:bg-[var(--color-surface-3)] ui-muted'"
          @click="selectedMonth = idx"
        >
          <span class="mr-1">{{ getMonthEmoji(idx) }}</span>
          {{ name }}
          <span class="ml-1 text-[10px] opacity-50">({{ getSeasonForMonth(idx) }})</span>
          <span class="float-right text-xs opacity-40 mt-0.5">{{ getIngredientCountForMonth(idx) }}</span>
        </button>
      </div>
    </details>
  </div>
</template>

<script setup lang="ts">
// ── Tipos ──────────────────────────────────────────────
interface SeasonalItem {
  name: string;
  months: number[]; // 0=Enero..11=Diciembre
  peak: boolean; // true si es mes de pico (mejor momento)
  category: string;
  tip: string;
  kcal_per_100g?: number;
  months_count: number;
}

interface CategoryGroup {
  key: string;
  label: string;
  emoji: string;
  items: SeasonalItem[];
}

// ── Datos de temporada (España / clima mediterráneo) ──
const SEASONAL_DATA: Omit<SeasonalItem, "months_count">[] = [
  // FRUTAS
  { name: "Naranja", months: [0, 1, 10, 11], peak: true, category: "fruta", tip: "Más dulce y jugosa en invierno", kcal_per_100g: 47 },
  { name: "Mandarina", months: [0, 1, 10, 11], peak: true, category: "fruta", tip: "Perfecta para postre o merienda", kcal_per_100g: 53 },
  { name: "Limón", months: [0, 1, 2, 3, 10, 11], peak: false, category: "fruta", tip: "Imprescindible para aliños y pescados", kcal_per_100g: 29 },
  { name: "Fresas", months: [2, 3, 4, 5], peak: true, category: "fruta", tip: "Elige las más rojas y aromáticas", kcal_per_100g: 32 },
  { name: "Cerezas", months: [5, 6], peak: true, category: "fruta", tip: "Temporada corta pero intensa", kcal_per_100g: 63 },
  { name: "Melocotón", months: [5, 6, 7, 8], peak: true, category: "fruta", tip: "De hueso fácil de desprender en su punto", kcal_per_100g: 39 },
  { name: "Sandía", months: [6, 7, 8], peak: true, category: "fruta", tip: "Refrescante, ideal para gazpacho de sandía", kcal_per_100g: 30 },
  { name: "Melón", months: [6, 7, 8, 9], peak: true, category: "fruta", tip: "Combina bien con jamón serrano", kcal_per_100g: 34 },
  { name: "Higos", months: [7, 8, 9], peak: true, category: "fruta", tip: "Excelentes con queso fresco y miel", kcal_per_100g: 74 },
  { name: "Uvas", months: [8, 9, 10], peak: true, category: "fruta", tip: "De mesa o para congelar como snack", kcal_per_100g: 69 },
  { name: "Manzana", months: [8, 9, 10, 11], peak: true, category: "fruta", tip: "Variedad reineta en otoño es excepcional", kcal_per_100g: 52 },
  { name: "Pera", months: [7, 8, 9, 10], peak: true, category: "fruta", tip: "De conferencia o ercolina en verano-otoño", kcal_per_100g: 57 },
  { name: "Granada", months: [9, 10, 11], peak: true, category: "fruta", tip: "Sus granos aportan color y antioxidantes", kcal_per_100g: 83 },
  { name: "Caqui", months: [10, 11], peak: true, category: "fruta", tip: "Espera a que esté bien blando para consumir", kcal_per_100g: 70 },
  { name: "Kiwi", months: [10, 11, 0, 1, 2], peak: false, category: "fruta", tip: "Rico en vitamina C, más que la naranja", kcal_per_100g: 61 },
  { name: "Aguacate", months: [10, 11, 0, 1, 2, 3, 4], peak: false, category: "fruta", tip: "Madura en casa a temperatura ambiente", kcal_per_100g: 160 },

  // VERDURAS
  { name: "Acelgas", months: [0, 1, 2, 3, 10, 11], peak: true, category: "verdura", tip: "Las hojas más tiernas en meses fríos", kcal_per_100g: 19 },
  { name: "Espinacas", months: [0, 1, 2, 3, 10, 11], peak: true, category: "verdura", tip: "Crudas en ensalada o salteadas con ajo", kcal_per_100g: 23 },
  { name: "Coliflor", months: [0, 1, 2, 11], peak: true, category: "verdura", tip: "Al horno con especias queda deliciosa", kcal_per_100g: 25 },
  { name: "Brócoli", months: [0, 1, 2, 10, 11], peak: true, category: "verdura", tip: "Al vapor conserva todas sus propiedades", kcal_per_100g: 34 },
  { name: "Alcachofas", months: [0, 1, 2, 3, 4], peak: true, category: "verdura", tip: "Frotar con limón para que no se oxiden", kcal_per_100g: 47 },
  { name: "Guisantes", months: [3, 4, 5], peak: true, category: "verdura", tip: "Frescos son mucho más dulces que congelados", kcal_per_100g: 81 },
  { name: "Espárragos verdes", months: [3, 4, 5], peak: true, category: "verdura", tip: "A la plancha con escamas de sal gorda", kcal_per_100g: 20 },
  { name: "Calabacín", months: [5, 6, 7, 8, 9], peak: true, category: "verdura", tip: "Versátil: crudo, asado, en espaguetis", kcal_per_100g: 17 },
  { name: "Pimiento", months: [6, 7, 8, 9], peak: true, category: "verdura", tip: "Asados al horno y pelados son un manjar", kcal_per_100g: 31 },
  { name: "Tomate", months: [6, 7, 8, 9], peak: true, category: "verdura", tip: "Solo en verano tiene sabor de verdad", kcal_per_100g: 18 },
  { name: "Berenjena", months: [6, 7, 8, 9], peak: true, category: "verdura", tip: "Salar 30 min antes para quitar amargor", kcal_per_100g: 25 },
  { name: "Pepino", months: [6, 7, 8], peak: true, category: "verdura", tip: "Base perfecta para gazpachos fríos", kcal_per_100g: 15 },
  { name: "Judías verdes", months: [6, 7, 8, 9], peak: true, category: "verdura", tip: "Al vapor con un toque de ajo y almendra", kcal_per_100g: 31 },
  { name: "Calabaza", months: [9, 10, 11], peak: true, category: "verdura", tip: "Crema de calabaza con jengibre en otoño", kcal_per_100g: 26 },
  { name: "Champiñones", months: [9, 10, 11], peak: true, category: "verdura", tip: "Salteados con ajo y perejil, un clásico", kcal_per_100g: 22 },
  { name: "Boniato", months: [9, 10, 11, 0], peak: true, category: "verdura", tip: "Asado al horno con piel, delicioso", kcal_per_100g: 86 },
  { name: "Zanahoria", months: [0, 1, 2, 3, 9, 10, 11], peak: false, category: "verdura", tip: "Disponible casi todo el año, base de sofritos", kcal_per_100g: 41 },
  { name: "Cebolla", months: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], peak: false, category: "verdura", tip: "Todo el año. La morada es más suave en crudo.", kcal_per_100g: 40 },
  { name: "Ajo", months: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], peak: false, category: "verdura", tip: "Conservar en lugar seco y oscuro", kcal_per_100g: 149 },
  { name: "Lechuga", months: [3, 4, 5, 6, 9, 10], peak: false, category: "verdura", tip: "Mejor en primavera y otoño, huye del calor extremo", kcal_per_100g: 15 },

  // PESCADOS
  { name: "Salmón", months: [2, 3, 4, 9, 10], peak: false, category: "pescado", tip: "Rico en Omega-3, mejor salvaje que piscifactoría", kcal_per_100g: 208 },
  { name: "Sardinas", months: [5, 6, 7, 8, 9], peak: true, category: "pescado", tip: "A la brasa con sal gorda, insuperables en verano", kcal_per_100g: 208 },
  { name: "Boquerones", months: [4, 5, 6, 7], peak: true, category: "pescado", tip: "En vinagre o fritos, tapa clásica", kcal_per_100g: 131 },
  { name: "Atún", months: [5, 6, 7, 8], peak: true, category: "pescado", tip: "Rojo y fresco en verano para tartar", kcal_per_100g: 132 },
  { name: "Merluza", months: [0, 1, 2, 3, 4, 5, 10, 11], peak: false, category: "pescado", tip: "Blanca y suave, gusta a toda la familia", kcal_per_100g: 90 },
  { name: "Bacalao", months: [0, 1, 2, 10, 11], peak: true, category: "pescado", tip: "Desalado, base de innumerables recetas", kcal_per_100g: 82 },
  { name: "Pulpo", months: [0, 1, 6, 7, 8], peak: false, category: "pescado", tip: "Cocer y luego asar a la brasa para que quede tierno", kcal_per_100g: 82 },
  { name: "Mejillones", months: [6, 7, 8, 9, 0, 1], peak: false, category: "pescado", tip: "Al vapor con limón, plato ligero y nutritivo", kcal_per_100g: 86 },

  // CARNES
  { name: "Cordero", months: [0, 1, 2, 3], peak: true, category: "carne", tip: "Estofado o al horno en meses fríos", kcal_per_100g: 282 },
  { name: "Pollo de corral", months: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], peak: false, category: "carne", tip: "Disponible todo el año, básico en cualquier dieta", kcal_per_100g: 165 },
  { name: "Conejo", months: [0, 1, 9, 10, 11], peak: false, category: "carne", tip: "Carne magra, excelente al ajillo o en paella", kcal_per_100g: 136 },
  { name: "Codorniz", months: [10, 11, 0, 1], peak: true, category: "carne", tip: "Escabechada o asada, plato de fiesta", kcal_per_100g: 192 },
];

// ── Constantes ─────────────────────────────────────────
const monthNames = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const seasonForMonth = [
  "invierno", "invierno", "primavera", "primavera", "primavera", "verano",
  "verano", "verano", "otoño", "otoño", "otoño", "invierno",
] as const;

const seasonMeta: Record<string, { emoji: string; name: string; description: string; tips: string[] }> = {
  invierno: {
    emoji: "❄️",
    name: "Invierno",
    description: "Temporada de cítricos, coles, legumbres y guisos de cuchara.",
    tips: [
      "Aprovecha cítricos para zumos naturales y refuerzo de vitamina C.",
      "Las verduras de hoja verde (acelgas, espinacas) están en su punto.",
      "Guisos y estofados con legumbres: plato único nutritivo y económico.",
      "Compra coles (coliflor, brócoli) para asar al horno con especias.",
    ],
  },
  primavera: {
    emoji: "🌸",
    name: "Primavera",
    description: "Explosión de verduras tiernas, fresas y primeros pescados azules.",
    tips: [
      "Las fresas y cerezas marcan el inicio de la fruta dulce del año.",
      "Espárragos verdes y guisantes frescos: salteado rápido con ajo.",
      "Empiezan las ensaladas frescas con lechugas de hoja tierna.",
      "Los huevos de corral están en su mejor momento; tortillas y revueltos.",
    ],
  },
  verano: {
    emoji: "☀️",
    name: "Verano",
    description: "Abundancia de tomates, pimientos, melones y pescado azul a la brasa.",
    tips: [
      "Gazpachos, salmorejos y cremas frías con tomate y pepino de temporada.",
      "Sandía y melón: postres refrescantes naturales sin azúcar añadido.",
      "Sardinas y boquerones a la brasa, cena veraniega por excelencia.",
      "Berenjenas y calabacines: a la plancha, rellenos o en escalivada.",
    ],
  },
  otoño: {
    emoji: "🍂",
    name: "Otoño",
    description: "Setas, calabazas, castañas y frutas de hueso tardías.",
    tips: [
      "Calabaza y boniato: cremas calientes y asados para el frío que llega.",
      "Setas y champiñones de temporada: salteados o en revueltos.",
      "Manzanas y peras en su punto dulce óptimo para compotas y tartas.",
      "Granadas y caquis: frutas otoñales llenas de antioxidantes.",
    ],
  },
};

// ── Props ─────────────────────────────────────────────
const props = withDefaults(
  defineProps<{
    initialMonth?: number; // 0-11, default: mes actual
    compact?: boolean;
  }>(),
  {
    initialMonth: -1, // -1 = usar mes actual
    compact: false,
  },
);

const emit = defineEmits<{
  "month-changed": [month: number];
}>();

// ── Estado ────────────────────────────────────────────
const currentMonth = new Date().getMonth(); // 0-11
const selectedMonth = ref(
  props.initialMonth >= 0 && props.initialMonth <= 11 ? props.initialMonth : currentMonth,
);

// ── Computed ──────────────────────────────────────────
const seasonName = computed(() => seasonMeta[seasonForMonth[selectedMonth.value]]?.name || "");
const seasonEmoji = computed(() => seasonMeta[seasonForMonth[selectedMonth.value]]?.emoji || "");
const seasonDescription = computed(() => seasonMeta[seasonForMonth[selectedMonth.value]]?.description || "");
const seasonalTips = computed(() => seasonMeta[seasonForMonth[selectedMonth.value]]?.tips || []);

const seasonBadgeClass = computed(() => {
  const s = seasonForMonth[selectedMonth.value];
  if (s === "invierno") return "bg-blue-950/50 text-blue-300 border border-blue-800/50";
  if (s === "primavera") return "bg-pink-950/50 text-pink-300 border border-pink-800/50";
  if (s === "verano") return "bg-amber-950/50 text-amber-300 border border-amber-800/50";
  return "bg-orange-950/50 text-orange-300 border border-orange-800/50";
});

const seasonalItems = computed<SeasonalItem[]>(() =>
  SEASONAL_DATA.filter((item) => item.months.includes(selectedMonth.value))
    .map((item) => ({
      ...item,
      months_count: item.months.length,
      peak: item.months.includes(selectedMonth.value) && item.months.some(
        (m) => m === selectedMonth.value && item.peak
      ),
    }))
    .sort((a, b) => {
      // Ordenar: primero los de pico, luego alfabético
      if (a.peak && !b.peak) return -1;
      if (!a.peak && b.peak) return 1;
      return a.name.localeCompare(b.name);
    }),
);

const categoryKeys = ["fruta", "verdura", "pescado", "carne"] as const;
const categoryMeta: Record<string, { label: string; emoji: string }> = {
  fruta: { label: "Frutas", emoji: "🍎" },
  verdura: { label: "Verduras y hortalizas", emoji: "🥬" },
  pescado: { label: "Pescados y mariscos", emoji: "🐟" },
  carne: { label: "Carnes", emoji: "🥩" },
};

const categories = computed<CategoryGroup[]>(() =>
  categoryKeys.map((key) => ({
    key,
    label: categoryMeta[key].label,
    emoji: categoryMeta[key].emoji,
    items: seasonalItems.value.filter((item) => item.category === key),
  })),
);

// ── Métodos ───────────────────────────────────────────
function getSeasonForMonth(month: number): string {
  const s = seasonForMonth[month];
  if (s === "invierno") return "Inv";
  if (s === "primavera") return "Pri";
  if (s === "verano") return "Ver";
  return "Oto";
}

function getMonthEmoji(month: number): string {
  const s = seasonForMonth[month];
  if (s === "invierno") return "❄️";
  if (s === "primavera") return "🌸";
  if (s === "verano") return "☀️";
  return "🍂";
}

function getIngredientCountForMonth(month: number): number {
  return SEASONAL_DATA.filter((item) => item.months.includes(month)).length;
}

function previousMonth() {
  selectedMonth.value = selectedMonth.value === 0 ? 11 : selectedMonth.value - 1;
  emit("month-changed", selectedMonth.value);
}

function nextMonth() {
  selectedMonth.value = selectedMonth.value === 11 ? 0 : selectedMonth.value + 1;
  emit("month-changed", selectedMonth.value);
}

function onMonthChanged() {
  emit("month-changed", selectedMonth.value);
}

function resetToCurrentMonth() {
  selectedMonth.value = currentMonth;
  emit("month-changed", selectedMonth.value);
}
</script>

<style scoped>
.peak-badge {
  display: inline-block;
  background: #065f46;
  color: #a7f3d0;
  border-radius: 999px;
  padding: 0.125rem 0.5rem;
  font-size: 0.625rem;
  font-weight: 700;
}
</style>
