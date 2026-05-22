<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold ui-title ui-title">Ingredientes maestros</h1>
        <p class="text-sm ui-subtle ui-subtle">
          Base nutricional por 100g para cálculos del menú rotativo.
        </p>
      </div>
      <button class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700" @click=" addIngredient ">
        Nuevo ingrediente
      </button>
    </header>

    <section class="ui-surface rounded-lg border p-4">
      <div class="flex flex-wrap items-center gap-2">
        <button
          v-if="selectedIds.length > 0"
          class="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          :disabled=" selectedIds.length === 0 " @click=" deleteSelected ">
          Eliminar seleccionados ({{ selectedIds.length }})
        </button>
        <button class="px-3 py-2 text-sm bg-slate-700 text-white rounded-lg hover:bg-slate-800"
          @click="showImportCsvModal = true">
          Importar CSV
        </button>
        <button class="px-3 py-2 text-sm bg-emerald-700 text-white rounded-lg hover:bg-emerald-800"
          :disabled="exportingCsv" @click="exportCsv">
          {{ exportingCsv ? "Exportando..." : "Exportar CSV" }}
        </button>
        <button
          v-if="selectedIds.length > 1"
          class="px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          :disabled="selectedIds.length < 2" @click="openMergeSelectedModal">
          Fusionar seleccionados
        </button>
        <span class="text-xs ui-subtle ui-subtle">
          Valores nutricionales expresados por 100 g.
        </span>
      </div>
    </section>

    <section class="ui-surface rounded-xl p-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold text-white">Expansiones de ingredientes</h2>
          <p class="text-sm ui-muted">
            Gestiona reglas de expansion en una pagina dedicada.
          </p>
        </div>
        <NuxtLink
          href="/ingredients/expansions"
          class="rounded-2xl border border-white/30 px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-surface-3)]/60"
        >
          Abrir expansiones
        </NuxtLink>
      </div>
    </section>

    <section class="ui-surface rounded-lg border p-4">
      <div class="grid gap-2 md:grid-cols-1">
        <input v-model.trim=" query " class="w-full border rounded-lg px-3 py-2" placeholder="Buscar ingrediente..." />
      </div>
      <div class="mt-3 flex flex-wrap items-center gap-2">
        <button v-for=" option in filterOptions " :key=" option.value "
          class="rounded-full border px-3 py-1.5 text-xs font-medium" :class=" filterMode === option.value
            ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
            : 'ui-divider ui-divider ui-subtle ui-muted hover:bg-[var(--color-surface-3)]'
            " @click="filterMode = option.value">
          {{ option.label }} {{ option.count }}
        </button>
        <label class="inline-flex items-center gap-2 rounded-full border ui-divider ui-divider px-3 py-1.5 text-xs font-medium ui-subtle ui-muted">
          <input v-model=" showOnlyWithoutRecipes " type="checkbox" class="h-3.5 w-3.5" />
          Solo sin recetas
        </label>
      </div>
    </section>

    <section class="space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border ui-surface p-4">
        <label class="inline-flex items-center gap-2 text-sm ui-muted ui-muted">
          <input type="checkbox" :checked=" allFilteredSelected " @change=" toggleSelectAllFiltered " />
          Seleccionar visibles
        </label>
        <div class="text-xs ui-subtle ui-subtle">
          Mostrando {{ filtered.length }} de {{ rows.length }} ingredientes
        </div>
      </div>

      <IngredientCard v-for=" row in filtered " :key=" row.id " :row=" row " :original=" originalForRow( row.id ) "
        :quality=" qualityForRow( row ) " :changed-fields=" changedFieldsForRow( row ) "
        :caloric-label=" caloricLabelForRow( row ) "
        :selected=" isSelected( row.id ) " :active=" activeIngredientId === row.id "
        :saving=" savingStatusForRow( row.id ) === 'saving' " :save-state=" savingStatusForRow( row.id ) "
        :is-temporary=" String( row.id ).startsWith( 'tmp-' ) "
        :is-first=" filtered.findIndex( ( item ) => item.id === row.id ) === 0 " :is-last=" filtered.findIndex( ( item ) => item.id === row.id ) ===
          filtered.length - 1
          " :unit-types=" unitTypes " :recipes=" recipesForIngredient( row.id ) "
        :candidates=" candidatesForIngredient( row.id ) " @patch="patchRow( row.id, $event )" @save="save( row )"
        @save-next="save( row, { goNext: true } )" @toggle-selected="toggleSelected( row.id )"
        @previous="moveActive( row.id, -1 )" @next="moveActive( row.id, 1 )" @delete="deleteOne( row.id )"
        @apply-candidate=" applyCandidate " @show-candidate-debug=" showCandidateDebug " />
      <div v-if=" filtered.length === 0 " class="rounded-lg border ui-surface p-4 text-sm ui-subtle ui-subtle">
        {{ showOnlyWithoutRecipes
          ? "No se encontraron ingredientes sin recetas con los filtros actuales."
          : "No hay ingredientes que coincidan con los filtros actuales."
        }}
      </div>
    </section>

    <section v-if=" selectedCandidateDebug " class="rounded-lg border border-indigo-100 bg-indigo-50 p-3 space-y-2">
      <div class="flex items-center justify-between gap-2">
        <p class="text-xs font-medium text-indigo-800">
          Debug OFF/USDA: {{ selectedCandidateDebug.name }} · confianza {{ Number( selectedCandidateDebug.confidence || 0 ).toFixed( 2 ) }}
        </p>
        <button class="text-xs text-indigo-700" @click=" selectedCandidateDebug = null ">
          Cerrar
        </button>
      </div>
      <pre class="max-h-64 overflow-auto rounded ui-surface p-2 text-[11px] text-slate-700 ui-muted">{{ JSON.stringify( selectedCandidateDebug.raw_payload || {}, null, 2 ) }}</pre>
    </section>

    <div v-if="showImportCsvModal" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="showImportCsvModal = false">
      <div class="absolute inset-0 bg-black/50"></div>
      <div class="relative w-full max-w-3xl rounded-lg ui-surface p-4 space-y-3">
        <h3 class="text-lg font-semibold ui-title ui-title">Importar CSV</h3>
        <p class="text-xs ui-subtle ui-subtle">
          Cabeceras: `name,english_name,normalized_name,default_unit_type,kcal_per_100g,protein_per_100g,carbs_per_100g,fat_per_100g`
        </p>
        <textarea v-model="csvInput" class="w-full min-h-[240px] border rounded-lg px-3 py-2 text-sm"
          placeholder="Pega aquí el CSV completo" />
        <div class="flex justify-end gap-2">
          <button class="px-3 py-2 border rounded-lg" @click="showImportCsvModal = false">Cancelar</button>
          <button class="px-3 py-2 bg-emerald-600 text-white rounded-lg disabled:opacity-50"
            :disabled="importingCsv || !csvInput.trim()" @click="importCsv">
            {{ importingCsv ? "Importando..." : "Importar" }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showMergeSelectedModal" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="showMergeSelectedModal = false">
      <div class="absolute inset-0 bg-black/50"></div>
      <div class="relative w-full max-w-xl rounded-lg ui-surface p-4 space-y-3">
        <h3 class="text-lg font-semibold ui-title ui-title">Fusionar ingredientes seleccionados</h3>
        <p class="text-sm ui-subtle ui-muted">Seleccionados: {{ selectedIds.length }}. Elige cuál se queda como destino.</p>
        <select v-model="mergeDestinationId" class="w-full border rounded-lg px-3 py-2">
          <option value="">Selecciona destino</option>
          <option v-for="item in mergeSelectedOptions" :key="item.id" :value="item.id">{{ item.name }}</option>
        </select>
        <div class="flex justify-end gap-2">
          <button class="px-3 py-2 border rounded-lg" @click="showMergeSelectedModal = false">Cancelar</button>
          <button class="px-3 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50"
            :disabled="mergingSelected || !mergeDestinationId" @click="mergeSelectedIngredients">
            {{ mergingSelected ? "Fusionando..." : "Confirmar fusión" }}
          </button>
        </div>
      </div>
    </div>
  </div>

</template>

<script setup lang="ts">
import { logError } from "~/utils/log-error";
import { normalizeIngredientName } from "~/utils/ingredient-normalize";
import { validateIngredientNutritionQuality } from "~/utils/ingredient-nutrition-quality";
import {
  caloricDensityLabel,
  classifyCaloricDensity,
} from "~/utils/caloric-density";
import type { Ingredient } from "~/types";
import { useAppToast } from "~/composables/use-app-toast";

const appToast = useAppToast();
const { confirm: confirmDialog } = useConfirmDialog();

type IngredientRow = Ingredient & {
  default_unit_type: "kg" | "g" | "l" | "ml" | "ud" | "pack" | "unidad";
  is_verified: boolean;
  source: string;
  external_id?: string | null;
  barcode?: string | null;
  nutrition_status?: "complete" | "pending" | "needs_review" | "not_found";
};
type ReviewCandidate = {
  id: string;
  ingredient_id: string;
  source: string;
  name: string;
  kcal_per_100g: number | null;
  protein_per_100g: number | null;
  carbs_per_100g: number | null;
  fat_per_100g: number | null;
  confidence: number;
  raw_payload?: any;
};
type RecipeLink = {
  id: string;
  name: string;
};
type FilterMode = "all" | "review" | "incomplete" | "inconsistent" | "ok";
type SaveState = "idle" | "saving" | "success" | "error";
type OriginalIngredientSnapshot = Pick<
  IngredientRow,
  | "name"
  | "english_name"
  | "default_unit_type"
  | "kcal_per_100g"
  | "protein_per_100g"
  | "carbs_per_100g"
  | "fat_per_100g"
>;

const supabase = useSupabase();
const route = useRoute();
const query = ref( "" );
const rows = ref<IngredientRow[]>( [] );
const originalsById = ref<Record<string, OriginalIngredientSnapshot>>( {} );
const csvInput = ref( "" );
const importingCsv = ref( false );
const reviewCandidates = ref<ReviewCandidate[]>( [] );
const selectedIds = ref<string[]>( [] );
const savingRowStates = ref<Record<string, SaveState>>( {} );
const activeIngredientId = ref<string | null>( null );
const filterMode = ref<FilterMode>( "all" );
const selectedCandidateDebug = ref<ReviewCandidate | null>( null);
const showImportCsvModal = ref(false);
const exportingCsv = ref(false);
const showMergeSelectedModal = ref(false);
const mergingSelected = ref(false);
const mergeDestinationId = ref("");
const showOnlyWithoutRecipes = ref( false );
const recipeLinksByIngredientId = ref<Record<string, RecipeLink[]>>( {} );
const unitTypes: Array<"kg" | "g" | "l" | "ml" | "ud" | "pack" | "unidad"> = [
  "g",
  "kg",
  "ml",
  "l",
  "ud",
  "pack",
  "unidad",
];

const mergeSelectedOptions = computed(() =>
  rows.value.filter((row) => selectedIds.value.includes(row.id)),
);

const qualityForRow = ( row: IngredientRow ) =>
  validateIngredientNutritionQuality( {
    kcal_per_100g: row.kcal_per_100g,
    protein_per_100g: row.protein_per_100g,
    carbs_per_100g: row.carbs_per_100g,
    fat_per_100g: row.fat_per_100g,
  } );

const filtered = computed( () => {
  const q = query.value.toLowerCase();
  return rows.value.filter( ( item ) => {
    const byName = item.name.toLowerCase().includes( q );
    const byNormalized = String( item.normalized_name || "" )
      .toLowerCase()
      .includes( q );
    const byEnglish = String( item.english_name || "" )
      .toLowerCase()
      .includes( q );
    const matchesSearch = !q || byName || byNormalized || byEnglish;
    if ( !matchesSearch ) return false;

    if ( showOnlyWithoutRecipes.value ) {
      const recipeCount = ( recipeLinksByIngredientId.value[ item.id ] || [] ).length;
      if ( recipeCount > 0 ) return false;
    }

    const quality = qualityForRow( item );
    if ( filterMode.value === "review" ) {
      return item.nutrition_status === "needs_review" || quality.needsReview;
    }
    if ( filterMode.value === "incomplete" ) {
      return quality.status === "incomplete";
    }
    if ( filterMode.value === "inconsistent" ) {
      return quality.status === "inconsistent";
    }
    if ( filterMode.value === "ok" ) {
      return quality.status === "ok";
    }
    return true;
  } );
} );

const filterStats = computed( () => {
  return rows.value.reduce(
    ( stats, row ) => {
      const quality = qualityForRow( row );
      stats.all += 1;
      if ( row.nutrition_status === "needs_review" || quality.needsReview ) {
        stats.review += 1;
      }
      if ( quality.status === "incomplete" ) stats.incomplete += 1;
      if ( quality.status === "inconsistent" ) stats.inconsistent += 1;
      if ( quality.status === "ok" ) stats.ok += 1;
      return stats;
    },
    { all: 0, review: 0, incomplete: 0, inconsistent: 0, ok: 0 },
  );
} );

const filterOptions = computed<Array<{ value: FilterMode; label: string; count: number }>>(
  () => [
    { value: "all", label: "Todos", count: filterStats.value.all },
    { value: "review", label: "A revisar", count: filterStats.value.review },
    {
      value: "incomplete",
      label: "Incompletos",
      count: filterStats.value.incomplete,
    },
    {
      value: "inconsistent",
      label: "Inconsistentes",
      count: filterStats.value.inconsistent,
    },
    { value: "ok", label: "OK", count: filterStats.value.ok },
  ],
);

const allFilteredSelected = computed( () => {
  const visibleIds = filtered.value
    .map( ( row ) => row.id )
    .filter( ( id ) => !String( id ).startsWith( "tmp-" ) );
  if ( visibleIds.length === 0 ) return false;
  return visibleIds.every( ( id ) => selectedIds.value.includes( id ) );
} );

const load = async () => {
  const { data } = await supabase
    .from( "ingredients" )
    .select( "*" )
    .order( "name", { ascending: true } )
    .limit( 500 );
  rows.value = ( data || [] ).map( ( row: any ) => ( {
    ...row,
    default_unit_type: row.default_unit_type || row.unit_type || "g",
    is_verified: Boolean( row.is_verified ),
    source: row.source || "manual_csv",
  } ) );
  originalsById.value = Object.fromEntries(
    rows.value.map( ( row ) => [
      row.id,
      {
        name: row.name,
        english_name: row.english_name,
        default_unit_type: row.default_unit_type,
        kcal_per_100g: row.kcal_per_100g,
        protein_per_100g: row.protein_per_100g,
        carbs_per_100g: row.carbs_per_100g,
        fat_per_100g: row.fat_per_100g,
      },
    ] ),
  );
  if ( !activeIngredientId.value && rows.value.length > 0 ) {
    activeIngredientId.value = rows.value[ 0 ]?.id || null;
  }
  selectedIds.value = selectedIds.value.filter( ( id ) =>
    rows.value.some( ( row ) => row.id === id ),
  );
  const { data: candidateRows } = await supabase
    .from( "ingredient_nutrition_candidates" )
    .select( "*" )
    .gte( "confidence", 0.75 )
    .order( "created_at", { ascending: false } )
    .limit( 60 );
  reviewCandidates.value = ( candidateRows || [] ) as ReviewCandidate[];

  const ingredientIds = rows.value
    .map( ( row ) => row.id )
    .filter( ( id ) => !String( id ).startsWith( "tmp-" ) );
  if ( ingredientIds.length === 0 ) {
    recipeLinksByIngredientId.value = {};
    return;
  }

  const { data: recipeRows, error: recipeRowsError } = await supabase
    .from( "recipe_ingredients" )
    .select( "ingredient_id, dishes(id, name)" )
    .in( "ingredient_id", ingredientIds )
    .not( "ingredient_id", "is", null );
  if ( recipeRowsError ) {
    await logError( "web", recipeRowsError, {
      context: "ingredients.loadRecipeLinks",
    } );
    recipeLinksByIngredientId.value = {};
    return;
  }

  const nextLinks: Record<string, RecipeLink[]> = {};
  for ( const item of recipeRows || [] ) {
    const ingredientId = String( ( item as any ).ingredient_id || "" );
    const dish = ( item as any ).dishes;
    if ( !ingredientId || !dish?.id ) continue;
    if ( !nextLinks[ ingredientId ] ) nextLinks[ ingredientId ] = [];
    if ( !nextLinks[ ingredientId ].some( ( recipe ) => recipe.id === dish.id ) ) {
      nextLinks[ ingredientId ].push( {
        id: dish.id,
        name: dish.name || "Receta",
      } );
    }
  }
  recipeLinksByIngredientId.value = nextLinks;
};

const recipesForIngredient = ( ingredientId: string ) =>
  recipeLinksByIngredientId.value[ ingredientId ] || [];

const candidatesForIngredient = ( ingredientId: string ) =>
  reviewCandidates.value.filter(
    ( candidate ) => candidate.ingredient_id === ingredientId,
  );

const originalForRow = ( ingredientId: string ) =>
  originalsById.value[ ingredientId ] || {
    kcal_per_100g: null,
    protein_per_100g: null,
    carbs_per_100g: null,
    fat_per_100g: null,
  };

const changedFieldsForRow = ( row: IngredientRow ) => {
  const original = originalsById.value[ row.id ];
  if ( !original ) return [];
  return [
    "name",
    "english_name",
    "default_unit_type",
    "kcal_per_100g",
    "protein_per_100g",
    "carbs_per_100g",
    "fat_per_100g",
  ].filter( ( field ) => {
    return (
      ( row as any )[ field ] !== ( original as any )[ field ] &&
      !( ( row as any )[ field ] == null && ( original as any )[ field ] == null )
    );
  } );
};

const patchRow = ( ingredientId: string, patch: Partial<IngredientRow> ) => {
  const row = rows.value.find( ( item ) => item.id === ingredientId );
  if ( !row ) return;
  Object.assign( row, patch );
  activeIngredientId.value = ingredientId;
};

const savingStatusForRow = ( ingredientId: string ) =>
  savingRowStates.value[ ingredientId ] || "idle";

const isSelected = ( id: string ) => selectedIds.value.includes( id );

const toggleSelected = ( id: string ) => {
  if ( isSelected( id ) ) {
    selectedIds.value = selectedIds.value.filter( ( current ) => current !== id );
    return;
  }
  if ( !String( id ).startsWith( "tmp-" ) ) {
    selectedIds.value.push( id );
  }
};

const toggleSelectAllFiltered = () => {
  const visibleIds = filtered.value
    .map( ( row ) => row.id )
    .filter( ( id ) => !String( id ).startsWith( "tmp-" ) );
  if ( visibleIds.length === 0 ) return;
  if ( allFilteredSelected.value ) {
    selectedIds.value = selectedIds.value.filter(
      ( id ) => !visibleIds.includes( id ),
    );
    return;
  }
  selectedIds.value = Array.from(
    new Set( [ ...selectedIds.value, ...visibleIds ] ),
  );
};

const applyCandidate = async ( candidateId: string ) => {
  try {
    await $fetch( "/api/ingredients-apply-candidate", {
      method: "POST",
      body: { candidateId },
    } );
    await load();
    appToast.success("Candidato aplicado correctamente.");
  } catch ( error ) {
    await logError( "web", error, { context: "ingredients.applyCandidate" } );
    appToast.fromError("No se pudo aplicar el candidato.", error);
  }
};

const moveActive = ( ingredientId: string, direction: -1 | 1 ) => {
  const currentIndex = filtered.value.findIndex( ( row ) => row.id === ingredientId );
  if ( currentIndex < 0 ) return;
  const next = filtered.value[ currentIndex + direction ];
  if ( next ) activeIngredientId.value = next.id;
};

const addIngredient = () => {
  const id = `tmp-${ Date.now() }` as any;
  const newRow = {
    id,
    name: "",
    english_name: null,
    normalized_name: "",
    unit_type: "g",
    default_unit_type: "g",
    kcal_per_100g: null,
    protein_per_100g: null,
    carbs_per_100g: null,
    fat_per_100g: null,
    source: "manual_csv",
    external_id: null,
    barcode: null,
    is_verified: false,
    nutrition_status: "pending",
    created_at: new Date().toISOString(),
  } as IngredientRow;
  rows.value.unshift( newRow );
  originalsById.value = {
    ...originalsById.value,
    [ id ]: {
      name: "",
      english_name: null,
      default_unit_type: "g",
      kcal_per_100g: null,
      protein_per_100g: null,
      carbs_per_100g: null,
      fat_per_100g: null,
    },
  };
  activeIngredientId.value = id;
};

const save = async ( row: IngredientRow, options: { goNext?: boolean } = {} ) => {
  if ( !row.name.trim() ) return;
  activeIngredientId.value = row.id;
  const nutritionQuality = validateIngredientNutritionQuality( {
    kcal_per_100g: row.kcal_per_100g,
    protein_per_100g: row.protein_per_100g,
    carbs_per_100g: row.carbs_per_100g,
    fat_per_100g: row.fat_per_100g,
  } );
  const payload = {
    name: row.name.trim(),
    english_name: row.english_name?.trim() || null,
    normalized_name: normalizeIngredientName( row.name ),
    default_unit_type: row.default_unit_type,
    unit_type: row.default_unit_type,
    kcal_per_100g: row.kcal_per_100g,
    protein_per_100g: row.protein_per_100g,
    carbs_per_100g: row.carbs_per_100g,
    fat_per_100g: row.fat_per_100g,
    source: "manual_csv",
    external_id: row.external_id || null,
    barcode: row.barcode || null,
    is_verified: !!row.is_verified && !nutritionQuality.needsReview,
    nutrition_status: !nutritionQuality.hasCompleteNutrition
      ? "pending"
      : nutritionQuality.needsReview
        ? "needs_review"
        : "complete",
    review_reason: nutritionQuality.needsReview
      ? nutritionQuality.warnings.join( " | " ) || "manual_review_required"
      : null,
    caloric_density_level: classifyCaloricDensity( row.kcal_per_100g ),
  };
  savingRowStates.value = { ...savingRowStates.value, [ row.id ]: "saving" };
  try {
    if ( String( row.id ).startsWith( "tmp-" ) ) {
      const { data: inserted, error } = await supabase
        .from( "ingredients" )
        .insert( payload )
        .select( "id" )
        .single();
      if ( error ) throw error;
    if ( inserted?.id ) activeIngredientId.value = inserted.id;
      appToast.success("Ingrediente creado correctamente.");
    } else {
      const { error } = await supabase
        .from( "ingredients" )
        .update( payload )
        .eq( "id", row.id );
      if ( error ) throw error;
      appToast.success("Ingrediente guardado correctamente.");
    }
    savingRowStates.value = { ...savingRowStates.value, [ row.id ]: "success" };
    await load();
    if ( options.goNext && activeIngredientId.value ) {
      moveActive( activeIngredientId.value, 1 );
    }
  } catch ( error ) {
    savingRowStates.value = { ...savingRowStates.value, [ row.id ]: "error" };
    await logError( "web", error, { context: "ingredients.save" } );
    appToast.fromError("No se pudo guardar el ingrediente.", error);
  }
};

const showCandidateDebug = ( candidateId: string ) => {
  const candidate = reviewCandidates.value.find( ( row ) => row.id === candidateId ) || null;
  selectedCandidateDebug.value = candidate;
};

const caloricLabelForRow = ( row: IngredientRow ) =>
  caloricDensityLabel( row.caloric_density_level || classifyCaloricDensity( row.kcal_per_100g ) );

const deleteOne = async ( id: string ) => {
  if ( String( id ).startsWith( "tmp-" ) ) {
    rows.value = rows.value.filter( ( row ) => row.id !== id );
    return;
  }
  const confirmed = await confirmDialog( {
    title: "Eliminar ingrediente",
    message: "¿Eliminar este ingrediente?",
    confirmText: "Eliminar",
    danger: true,
  } );
  if ( !confirmed ) return;
  try {
    const { error } = await supabase.from( "ingredients" ).delete().eq( "id", id );
    if ( error ) throw error;
    selectedIds.value = selectedIds.value.filter( ( item ) => item !== id );
    await load();
    appToast.success("Ingrediente eliminado.");
  } catch ( error ) {
    await logError( "web", error, { context: "ingredients.deleteOne" } );
    appToast.fromError("No se pudo eliminar el ingrediente.", error);
  }
};

const deleteSelected = async () => {
  if ( selectedIds.value.length === 0 ) return;
  const confirmed = await confirmDialog( {
    title: "Eliminar ingredientes",
    message: `¿Eliminar ${ selectedIds.value.length } ingredientes?`,
    confirmText: "Eliminar",
    danger: true,
  } );
  if ( !confirmed ) return;
  try {
    const { error } = await supabase
      .from( "ingredients" )
      .delete()
      .in( "id", selectedIds.value );
    if ( error ) throw error;
    selectedIds.value = [];
    await load();
    appToast.success("Ingredientes eliminados correctamente.");
  } catch ( error ) {
    await logError( "web", error, { context: "ingredients.deleteSelected" } );
    appToast.fromError("No se pudieron eliminar los ingredientes.", error);
  }
};

const importCsv = async () => {
  if ( !csvInput.value.trim() ) return;
  importingCsv.value = true;
  try {
    const result = await $fetch<{
      success: boolean;
      imported: number;
      inserted: number;
      updated: number;
      skipped: number;
      conflicts?: Array<{ name: string; reason: string }>;
    }>( "/api/ingredients-import-csv", {
      method: "POST",
      body: { csv: csvInput.value },
    } );
    csvInput.value = "";
    showImportCsvModal.value = false;
    await load();
    const conflictCount = Array.isArray( result?.conflicts )
      ? result.conflicts.length
      : 0;
    appToast.success(
      `CSV importado: ${ result.inserted } nuevos, ${ result.updated } actualizados, ${ result.skipped } repetidos omitidos${ conflictCount > 0 ? `, ${ conflictCount } conflictos` : "" }.`,
    );
  } catch ( error ) {
    await logError( "web", error, { context: "ingredients.importCsv" } );
    appToast.fromError("No se pudo importar el CSV.", error);
  } finally {
    importingCsv.value = false;
  }
};

const exportCsv = async () => {
  exportingCsv.value = true;
  try {
    const response = await $fetch.raw("/api/ingredients-export-csv", { method: "GET" });
    const csv = String(response._data || "");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ingredients-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    appToast.success("CSV exportado correctamente.");
  } catch (error) {
    await logError("web", error, { context: "ingredients.exportCsv" });
    appToast.fromError("No se pudo exportar el CSV.", error);
  } finally {
    exportingCsv.value = false;
  }
};

const openMergeSelectedModal = () => {
  if (selectedIds.value.length < 2) return;
  mergeDestinationId.value = selectedIds.value[0] || "";
  showMergeSelectedModal.value = true;
};

const mergeSelectedIngredients = async () => {
  if (!mergeDestinationId.value || selectedIds.value.length < 2) return;
  mergingSelected.value = true;
  try {
    await $fetch("/api/ingredients-merge-selected", {
      method: "POST",
      body: {
        selectedIngredientIds: selectedIds.value,
        destinationIngredientId: mergeDestinationId.value,
      },
    });
    selectedIds.value = [];
    mergeDestinationId.value = "";
    showMergeSelectedModal.value = false;
    await load();
    appToast.success("Ingredientes fusionados correctamente.");
  } catch (error) {
    await logError("web", error, { context: "ingredients.mergeSelectedIngredients" });
    appToast.fromError("No se pudieron fusionar los ingredientes.", error);
  } finally {
    mergingSelected.value = false;
  }
};


onMounted( () => {
  const queryFromRoute = String( route.query.q || "" ).trim();
  if ( queryFromRoute ) {
    query.value = queryFromRoute;
  }
  load();
} );
</script>
