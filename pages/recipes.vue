<template>
  <div class="min-h-screen bg-transparent">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <!-- Header -->
      <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div class="flex items-center gap-4">
          <div
            class="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-200">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h1 class="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Biblioteca de recetas
            </h1>
            <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">Curación de platos detectados por OCR</p>
          </div>
        </div>
        <div class="flex gap-3">
          <button
            class="px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium shadow-lg shadow-emerald-200 hover:shadow-xl transition-all"
            @click="showCreateRecipeModal = true">
            Nueva receta
          </button>
          <NuxtLink href="/ingredients"
            class="px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:bg-slate-900 hover:border-slate-300 dark:border-slate-600 transition-all text-sm font-medium">
            Ingredientes
          </NuxtLink>
          <button
            class="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl hover:from-violet-700 hover:to-purple-700 font-medium shadow-lg shadow-purple-200 hover:shadow-xl transition-all flex items-center gap-2"
            @click=" loadRecipes ">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 4v5h.582m15.582 0A13.93 13.93 0 0120 10c0 3.866-1.598 7.5-4.236 9.94a13.13 13.13 0 01-3.529 2.168A8.994 8.994 0 004 20c1.885 0 3.615.467 5.082 1.257M4 14h5.418a13.93 13.93 0 002.582 2.246c.927.475 1.986.76 3.04.853a8.997 8.997 0 016.336-3.038A8.978 8.978 0 0120 10c0-2.123-.74-4.09-1.96-5.618M4 14h5.418" />
            </svg>
            Actualizar
          </button>
        </div>
      </header>

      <!-- Search & Filters -->
      <section class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 mb-6">
        <div class="flex flex-wrap items-center gap-4">
          <label class="flex-1 min-w-[240px]">
            <div class="relative">
              <div class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input v-model.trim=" searchTerm "
                class="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Buscar receta por nombre..." />
            </div>
          </label>
          <label class="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:text-slate-100">
            <input type="checkbox" :checked=" allFilteredSelected " @change=" toggleSelectAllFiltered "
              class="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-purple-600 focus:ring-purple-500" />
            <span class="font-medium">Seleccionar visibles</span>
          </label>
          <label class="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:text-slate-100">
            <input v-model=" showOnlyWithoutIngredients " type="checkbox"
              class="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-purple-600 focus:ring-purple-500" />
            <span class="font-medium">Solo sin ingredientes</span>
          </label>
          <button v-for=" item in filterItems " :key=" item.value " class="px-3 py-1.5 rounded-lg border text-sm" :class=" filter === item.value
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'text-gray-700 dark:text-slate-200'
            " @click="filter = item.value">
            {{ item.label }}
          </button>
          <button class="px-3 py-1.5 rounded-lg border text-sm text-gray-700 dark:text-slate-200 disabled:opacity-50"
            :disabled=" selectedDishIds.length === 0 " @click=" clearSelection ">
            Limpiar selección
          </button>
          <button class="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm disabled:opacity-50"
            :disabled=" selectedDishIds.length === 0 || savingSelectedRecipes " @click=" saveSelectedRecipes ">
            {{
              savingSelectedRecipes
                ? "Guardando recetas..."
                : `Guardar seleccionadas (${ selectedDishIds.length })`
            }}
          </button>
          <button class="ml-auto px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm disabled:opacity-50"
            :disabled=" selectedDishIds.length === 0 " @click=" deleteSelectedRecipes ">
            Eliminar recetas ({{ selectedDishIds.length }})
          </button>
          <button class="px-3 py-1.5 rounded-lg bg-sky-700 text-white text-sm disabled:opacity-50"
            :disabled=" selectedDishIds.length < 2 || mergingRecipes " @click=" openMergePanel ">
            {{ mergingRecipes ? "Fusionando..." : "Fusionar seleccionadas" }}
          </button>
        </div>
        <div v-if=" showMergePanel " class="mt-3 border rounded-lg p-3 space-y-2">
          <p class="text-sm font-medium text-gray-900 dark:text-slate-100">Fusionar recetas</p>
          <label class="block">
            <span class="block text-xs text-gray-600 dark:text-slate-300 mb-1">Receta destino</span>
            <select v-model=" mergeTargetId " class="w-full border rounded-lg px-3 py-2">
              <option v-for=" dish in mergeCandidates " :key=" `merge-target-${ dish.id }` " :value=" dish.id ">
                {{ dish.name }}
              </option>
            </select>
          </label>
          <label class="block">
            <span class="block text-xs text-gray-600 dark:text-slate-300 mb-1">
              Nombre final (opcional)
            </span>
            <input v-model.trim=" mergeFinalName " class="w-full border rounded-lg px-3 py-2"
              placeholder="Si lo dejas vacío, se mantiene el nombre de la receta destino" />
          </label>
          <div class="flex justify-end gap-2">
            <button class="px-3 py-1.5 rounded-lg border text-sm" @click=" cancelMergePanel ">
              Cancelar
            </button>
            <button class="px-3 py-1.5 rounded-lg bg-sky-700 text-white text-sm disabled:opacity-50"
              :disabled=" !mergeTargetId || mergingRecipes " @click=" mergeSelectedRecipes ">
              Confirmar fusión
            </button>
          </div>
        </div>
      </section>

      <section class="space-y-3">
        <article v-if=" filteredDishes.length === 0 " class="bg-white dark:bg-slate-900 rounded-lg border p-5 text-sm text-gray-500 dark:text-slate-400">
          {{ showOnlyWithoutIngredients
            ? "No se encontraron recetas sin ingredientes con los filtros actuales."
            : "No hay recetas que coincidan con los filtros actuales."
          }}
        </article>
        <article v-for=" dish in filteredDishes " :key=" dish.id " class="bg-white dark:bg-slate-900 rounded-lg border p-4">
          <div class="flex flex-wrap justify-between gap-3">
            <div class="flex items-start gap-3">
              <label class="mt-1 inline-flex items-center">
                <input type="checkbox" :checked=" isDishSelected( dish.id ) " @change="toggleDishSelected( dish.id )" />
              </label>
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="font-semibold text-gray-900 dark:text-slate-100">{{ dish.name }}</h2>
                  <span class="rounded-full bg-gray-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-gray-700 dark:text-slate-200">
                    {{ ingredientCount( dish ) }} ingredientes
                  </span>
                  <span
                    v-if="recipeBlockersCount( dish ) > 0"
                    class="rounded-full bg-red-100 dark:bg-red-900/40 px-2 py-0.5 text-[11px] font-medium text-red-700 dark:text-red-300"
                  >
                    {{ recipeBlockersCount( dish ) }} bloqueos
                  </span>
                  <span v-if=" dish.is_special "
                    class="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                    Comida libre · {{ dish.special_kcal_reserved || 700 }} kcal
                  </span>
                </div>
                <p class="text-sm text-gray-500 dark:text-slate-400">
                  {{ dish.description || "Sin descripción" }}
                </p>
                <p class="text-xs mt-1" :class=" statusMeta( dish ).color ">
                  {{ statusMeta( dish ).label }}
                </p>
              </div>
            </div>
            <div class="flex gap-3">
              <button class="text-sm text-indigo-700" @click="toggleEdit( dish.id )">
                {{ editingDishId === dish.id ? "Cerrar" : "Editar / Curar" }}
              </button>
              <button class="text-sm text-emerald-700 disabled:opacity-50" :disabled=" isRecipeSaving( dish.id ) "
                @click="saveRecipeQuick( dish.id )">
                {{ isRecipeSaving( dish.id ) ? "Guardando..." : "Guardar" }}
              </button>
              <button class="text-sm text-sky-700" @click="openSplitPanel( dish )">
                Dividir
              </button>
              <button class="text-sm text-red-700" @click="deleteRecipe( dish.id )">
                Eliminar
              </button>
            </div>
          </div>

          <div v-if=" editingDishId === dish.id " class="mt-4 space-y-3">
            <div class="rounded-lg border p-3 space-y-2">
              <p class="text-xs font-medium text-gray-700 dark:text-slate-200">Datos de receta</p>
              <div class="grid gap-2 md:grid-cols-2">
                <label>
                  <span class="block text-xs text-gray-600 dark:text-slate-300 mb-1">Nombre</span>
                  <input v-model.trim=" recipeForm.name " class="w-full border rounded-lg px-3 py-2" />
                </label>
                <label>
                  <span class="block text-xs text-gray-600 dark:text-slate-300 mb-1">Descripción</span>
                  <input v-model.trim=" recipeForm.description " class="w-full border rounded-lg px-3 py-2" />
                </label>
                <label class="md:col-span-2">
                  <span class="inline-flex items-center gap-2 text-xs text-gray-700 dark:text-slate-200">
                    <input v-model=" recipeForm.is_special " type="checkbox" />
                    <span>Marcar receta como comida libre/especial</span>
                  </span>
                </label>
                <label v-if=" recipeForm.is_special " class="md:col-span-2">
                  <span class="block text-xs text-gray-600 dark:text-slate-300 mb-1">
                    kcal reservadas comida libre
                  </span>
                  <input v-model.number=" recipeForm.special_kcal_reserved " type="number" min="0" max="2000" step="10"
                    class="w-full border rounded-lg px-3 py-2" />
                </label>
              </div>
              <div class="flex justify-end">
                <button
                  class="text-xs px-3 py-1.5 rounded border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                  @click="saveRecipeForm( dish.id )">
                  Guardar formulario
                </button>
              </div>
            </div>

            <p class="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2">
              Ingredientes detectados desde el nombre del plato. Revisa y confirma
              antes de usar para cálculos.
            </p>

            <div
              v-if="recipeBlockers( dish ).length > 0"
              class="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 p-3 space-y-2"
            >
              <p class="text-xs font-semibold text-red-800 dark:text-red-300">
                Ingredientes que bloquean la generación
              </p>
              <ul class="space-y-1 text-xs text-red-700 dark:text-red-300">
                <li
                  v-for="blocker in recipeBlockers( dish )"
                  :key="`${dish.id}-${blocker.reason}-${blocker.name}`"
                  class="flex flex-wrap items-center gap-2"
                >
                  <span>- {{ blocker.name }} ({{ blocker.reason }})</span>
                  <button
                    v-if="blocker.reason === 'missing_ingredient_link'"
                    class="rounded border border-red-300 dark:border-red-700 px-2 py-0.5 text-[11px] font-medium hover:bg-red-100/60 dark:hover:bg-red-900/50"
                    @click="linkMissingIngredientInRecipe( dish.id, blocker.name )"
                  >
                    Vincular ahora
                  </button>
                  <button
                    v-else
                    class="rounded border border-red-300 dark:border-red-700 px-2 py-0.5 text-[11px] font-medium hover:bg-red-100/60 dark:hover:bg-red-900/50"
                    @click="goToIngredientsWithSearch( blocker.name )"
                  >
                    Abrir en ingredientes
                  </button>
                </li>
              </ul>
              <p class="text-[11px] text-red-700/90 dark:text-red-300/90">
                Solución: vincula ingrediente de catálogo o completa nutrición en Ingredientes.
              </p>
            </div>

            <h3 class="text-sm font-medium text-gray-900 dark:text-slate-100">
              Sugeridos (sin confirmar)
            </h3>
            <div class="flex justify-end">
              <button class="text-xs px-3 py-1.5 rounded border text-green-700 disabled:opacity-50"
                :disabled=" pendingRows.length === 0 || savingBatch " @click="confirmAllPendingRows( dish.id )">
                {{ savingBatch ? "Confirmando..." : "Confirmar todos" }}
              </button>
            </div>
            <div v-if=" pendingRows.length === 0 " class="text-sm text-gray-500 dark:text-slate-400">
              No hay sugerencias pendientes.
            </div>
            <div v-else class="space-y-2">
              <div v-for=" row in pendingRows " :key=" row.id " class="grid grid-cols-[1fr_150px_1fr] gap-2">
                <input v-model.trim=" row.name " class="border rounded-lg px-3 py-2" />
                <select v-model=" row.unit_type " class="border rounded-lg px-3 py-2">
                  <option value="">Unidad</option>
                  <option v-for=" unit in unitTypes " :key=" unit " :value=" unit ">
                    {{ unit }}
                  </option>
                </select>
                <div class="flex gap-2">
                  <button class="text-xs text-indigo-700" :disabled=" candidateLoading "
                    @click="autoApplyBestCandidate( row )">
                    Curar con OFF
                  </button>
                  <button class="text-xs text-sky-700" @click="openCandidateSearch( row )">
                    Buscar/curar fuente
                  </button>
                  <button class="text-xs text-green-700" @click="confirmRow( dish.id, row )">
                    Confirmar
                  </button>
                  <button class="text-xs text-red-700" @click="deleteRow( dish.id, row.id )">
                    Quitar
                  </button>
                </div>
                <div v-if=" candidateTargetRowId === row.id " class="col-span-4 rounded-lg border p-2 space-y-2">
                  <div class="grid grid-cols-[1fr_160px_auto] gap-2">
                    <input v-model.trim=" candidateQuery " class="border rounded-lg px-2 py-1 text-sm"
                      placeholder="Buscar alimento..." />
                    <select v-model=" candidateSource " class="border rounded-lg px-2 py-1 text-sm">
                      <option value="open_food_facts">Open Food Facts</option>
                      <option value="usda">USDA</option>
                      <option value="bedca">BEDCA (próximamente)</option>
                    </select>
                    <button class="text-xs px-2 py-1 rounded border" :disabled=" candidateLoading || !candidateQuery "
                      @click=" searchCandidatesForTarget ">
                      {{ candidateLoading ? "Buscando..." : "Buscar" }}
                    </button>
                  </div>
                  <div v-for=" candidate in candidateResults " :key=" `${ candidate.source }-${ candidate.external_id }` "
                    class="text-xs border rounded p-2">
                    <p class="font-medium">{{ candidate.name }}</p>
                    <p class="text-gray-500 dark:text-slate-400">
                      {{ candidate.nutrients.kcal_per_100g ?? "?" }} kcal · P
                      {{ candidate.nutrients.protein_per_100g ?? "?" }} · H
                      {{ candidate.nutrients.carbs_per_100g ?? "?" }} · G
                      {{ candidate.nutrients.fat_per_100g ?? "?" }}
                    </p>
                    <button class="mt-1 text-indigo-700" @click="saveIngredientFromCandidate( candidate, row )">
                      Curar ingrediente
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <h3 class="text-sm font-medium text-gray-900 dark:text-slate-100">
              Confirmados (base receta)
            </h3>
            <div class="flex justify-end">
              <button class="text-xs px-3 py-1.5 rounded border text-indigo-700 disabled:opacity-50"
                :disabled=" confirmedRows.length === 0 || savingBatch " @click="saveAllConfirmedRows( dish.id )">
                {{ savingBatch ? "Guardando..." : "Guardar todos" }}
              </button>
            </div>
            <div class="space-y-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-3">
              <div v-for=" row in confirmedRows " :key=" row.id " class="grid grid-cols-[1fr_150px_1fr] gap-2">
                <input v-model.trim=" row.name " class="border rounded-lg px-3 py-2" />
                <select v-model=" row.unit_type " class="border rounded-lg px-3 py-2">
                  <option v-for=" unit in unitTypes " :key=" unit " :value=" unit ">
                    {{ unit }}
                  </option>
                </select>
                <div class="flex gap-2">
                  <button class="text-xs text-indigo-700" :disabled=" candidateLoading "
                    @click="autoApplyBestCandidate( row )">
                    Curar con OFF
                  </button>
                  <button class="text-xs text-sky-700" @click="openCandidateSearch( row )">
                    Buscar/curar fuente
                  </button>
                  <button class="text-xs text-indigo-700" @click="saveConfirmedRow( dish.id, row )">
                    Guardar
                  </button>
                  <button class="text-xs text-red-700" @click="deleteRow( dish.id, row.id )">
                    Eliminar
                  </button>
                </div>
                <div v-if=" candidateTargetRowId === row.id " class="col-span-4 rounded-lg border p-2 space-y-2">
                  <div class="grid grid-cols-[1fr_160px_auto] gap-2">
                    <input v-model.trim=" candidateQuery " class="border rounded-lg px-2 py-1 text-sm"
                      placeholder="Buscar alimento..." />
                    <select v-model=" candidateSource " class="border rounded-lg px-2 py-1 text-sm">
                      <option value="open_food_facts">Open Food Facts</option>
                      <option value="usda">USDA</option>
                      <option value="bedca">BEDCA (próximamente)</option>
                    </select>
                    <button class="text-xs px-2 py-1 rounded border" :disabled=" candidateLoading || !candidateQuery "
                      @click=" searchCandidatesForTarget ">
                      {{ candidateLoading ? "Buscando..." : "Buscar" }}
                    </button>
                  </div>
                  <div v-for=" candidate in candidateResults " :key=" `${ candidate.source }-${ candidate.external_id }` "
                    class="text-xs border rounded p-2">
                    <p class="font-medium">{{ candidate.name }}</p>
                    <p class="text-gray-500 dark:text-slate-400">
                      {{ candidate.nutrients.kcal_per_100g ?? "?" }} kcal · P
                      {{ candidate.nutrients.protein_per_100g ?? "?" }} · H
                      {{ candidate.nutrients.carbs_per_100g ?? "?" }} · G
                      {{ candidate.nutrients.fat_per_100g ?? "?" }}
                    </p>
                    <button class="mt-1 text-indigo-700" @click="saveIngredientFromCandidate( candidate, row )">
                      Curar ingrediente
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button
              class="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
              @click="addManualConfirmed( dish.id )">
              + Añadir ingrediente manual
            </button>
            <div class="rounded-lg border border-sky-100 bg-sky-50/60 p-3 space-y-2">
              <p class="text-xs font-medium text-sky-800">
                Añadir ingrediente existente (catálogo)
              </p>
              <div class="flex flex-wrap gap-2">
                <input
                  v-model.trim="existingIngredientQuery"
                  :list="`existing-ingredients-list-${dish.id}`"
                  class="min-w-[260px] flex-1 border rounded-lg px-3 py-2 text-sm"
                  placeholder="Busca: aceite, pollo, arroz..." />
                <button
                  class="text-xs px-3 py-2 rounded border border-sky-200 bg-white dark:bg-slate-900 text-sky-800 hover:bg-sky-100"
                  :disabled="!existingIngredientQuery.trim()"
                  @click="addExistingIngredientByQuery( dish.id )">
                  Añadir desde catálogo
                </button>
              </div>
              <p v-if="catalogSearchLoading" class="text-xs text-sky-700">
                Buscando ingredientes...
              </p>
              <p v-else-if="catalogSearchError" class="text-xs text-red-600">
                {{ catalogSearchError }}
              </p>
              <p
                v-else-if="existingIngredientQuery.trim().length >= 2 && filteredExistingIngredients.length === 0"
                class="text-xs text-slate-500 dark:text-slate-400">
                No hay coincidencias en catálogo.
              </p>
              <datalist :id="`existing-ingredients-list-${dish.id}`">
                <option
                  v-for="ingredient in filteredExistingIngredients"
                  :key="`existing-${ingredient.id}`"
                  :value="ingredient.name" />
              </datalist>
            </div>
            <div class="rounded-lg border p-3 space-y-2">
              <p class="text-xs font-medium text-gray-700 dark:text-slate-200">
                Añadir varios ingredientes (uno por línea)
              </p>
              <textarea v-model=" bulkIngredientInput " class="w-full min-h-[96px] border rounded-lg px-3 py-2 text-sm"
                placeholder="Ej:
arroz
pollo
aceite de oliva" />
              <div class="flex justify-end">
                <button class="text-xs px-3 py-1.5 rounded border text-indigo-700 disabled:opacity-50"
                  :disabled=" !bulkIngredientInput.trim() || savingBulkIngredients " @click="addBulkIngredients( dish.id )">
                  {{
                    savingBulkIngredients
                      ? "Añadiendo..."
                      : "Añadir ingredientes en bloque"
                  }}
                </button>
              </div>
            </div>

            <p v-if=" formError " class="text-sm text-red-600">{{ formError }}</p>
          </div>
        </article>
      </section>
      <div v-if=" showSplitPanel " class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        @click.self=" closeSplitPanel ">
        <div class="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-lg bg-white dark:bg-slate-900 flex flex-col">
          <div class="p-4 space-y-3 overflow-y-auto">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-slate-100">Dividir receta</h3>
          <p class="text-sm text-gray-600 dark:text-slate-300">
            Receta original:
            <span class="font-medium">{{ splitSourceDish?.name }}</span>
          </p>
          <div v-if=" splitCandidates.length === 0 " class="text-sm text-amber-700">
            No detecté separadores claros (`+`, `de segundo`, `primero/segundo`).
          </div>
          <div v-else class="space-y-2">
            <p class="text-xs text-gray-600 dark:text-slate-300">
              Partes detectadas (editables antes de crear):
            </p>
            <div v-for=" ( part, index ) in splitCandidates " :key=" `split-${ index }` "
              class="grid grid-cols-[1fr_auto] gap-2">
              <input v-model.trim=" splitCandidates[ index ] " class="border rounded-lg px-3 py-2" />
              <button class="text-xs text-red-700" @click="splitCandidates.splice( index, 1 )">
                Quitar
              </button>
            </div>
          </div>
          </div>
          <div class="flex justify-end gap-2 p-4 border-t bg-white dark:bg-slate-900 shrink-0">
            <button class="px-3 py-1.5 rounded-lg border" @click=" closeSplitPanel ">
              Cancelar
            </button>
            <button class="px-3 py-1.5 rounded-lg bg-sky-700 text-white disabled:opacity-50"
              :disabled=" splitCandidates.length < 2 || splittingRecipe " @click=" splitRecipe ">
              {{ splittingRecipe ? "Dividiendo..." : "Crear recetas separadas" }}
            </button>
          </div>
        </div>
      </div>

      <div v-if=" showCreateRecipeModal " class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="showCreateRecipeModal = false">
        <div class="absolute inset-0 bg-black/50"></div>
        <div class="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-lg bg-white dark:bg-slate-900 flex flex-col">
          <div class="p-4 space-y-3 overflow-y-auto">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-slate-100">Crear receta nueva</h3>
          <label class="block">
            <span class="block text-xs text-gray-600 dark:text-slate-300 mb-1">Nombre</span>
            <input v-model.trim=" newRecipeForm.name " class="w-full border rounded-lg px-3 py-2"
              placeholder="Ej: Ensalada templada" />
          </label>
          <label class="block">
            <span class="block text-xs text-gray-600 dark:text-slate-300 mb-1">Descripción</span>
            <input v-model.trim=" newRecipeForm.description " class="w-full border rounded-lg px-3 py-2"
              placeholder="Opcional" />
          </label>
          <label class="block">
            <span class="block text-xs text-gray-600 dark:text-slate-300 mb-1">Ingredientes (uno por línea)</span>
            <textarea v-model=" newRecipeForm.ingredientsText " class="w-full min-h-[96px] border rounded-lg px-3 py-2 text-sm"
              placeholder="Ej:\ntomate\nmozzarella\naove" />
          </label>
          <label class="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-slate-200">
            <input v-model=" newRecipeForm.isSpecial " type="checkbox" />
            Marcar receta como comida libre/especial
          </label>
          </div>
          <div class="flex justify-end gap-2 p-4 border-t bg-white dark:bg-slate-900 shrink-0">
            <button class="px-3 py-1.5 rounded-lg border" @click=" showCreateRecipeModal = false ">
              Cancelar
            </button>
            <button class="px-3 py-1.5 rounded-lg bg-emerald-600 text-white disabled:opacity-50"
              :disabled=" creatingRecipe || !newRecipeForm.name " @click=" createRecipeManual ">
              {{ creatingRecipe ? "Creando..." : "Crear receta" }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { logError } from "~/utils/log-error";
import { normalizeIngredientName } from "~/utils/ingredient-normalize";
import { saveIngredientFromCandidate as persistCandidate } from "~/utils/save-ingredient-from-candidate";
import type { Dish, Ingredient, RecipeIngredient } from "~/types";

type DishRow = Dish & {
  recipe_ingredients?: Array<
    RecipeIngredient & { ingredients?: Ingredient | null }
  >;
};

const supabase = useSupabase();
const route = useRoute();
const router = useRouter();
const { loadCurrentUser } = useCurrentUser();
const appToast = useAppToast();
const { confirm: confirmDialog } = useConfirmDialog();

const unitTypes: Array<"kg" | "g" | "l" | "ml" | "ud" | "pack" | "unidad"> = [
  "g",
  "kg",
  "ml",
  "l",
  "ud",
  "pack",
  "unidad",
];

const dishes = ref<DishRow[]>( [] );
const filter = ref<"all" | "suggested" | "complete" | "not_required">( "all" );
const filterItems = [
  { value: "all", label: "Todas" },
  { value: "suggested", label: "Sugeridas" },
  { value: "complete", label: "Completas" },
  { value: "not_required", label: "No requiere" },
] as const;

const editingDishId = ref<string | null>( null );
const pendingRows = ref<Array<RecipeIngredient>>( [] );
const confirmedRows = ref<Array<RecipeIngredient>>( [] );
const formError = ref( "" );
const candidateTargetRowId = ref<string | null>( null );
const candidateSource = ref<"usda" | "open_food_facts" | "bedca">(
  "open_food_facts",
);
const candidateQuery = ref( "" );
const candidateResults = ref<any[]>( [] );
const candidateLoading = ref( false );
const selectedDishIds = ref<string[]>( [] );
const savingDishIds = ref<string[]>( [] );
const savingSelectedRecipes = ref( false );
const savingBatch = ref( false );
const savingBulkIngredients = ref( false );
const searchTerm = ref( "" );
const showOnlyWithoutIngredients = ref( false );
const bulkIngredientInput = ref( "" );
const showMergePanel = ref( false );
const mergeTargetId = ref( "" );
const mergeFinalName = ref( "" );
const mergingRecipes = ref( false );
const showSplitPanel = ref( false );
const splitSourceDish = ref<DishRow | null>( null );
const splitCandidates = ref<string[]>( [] );
const splittingRecipe = ref( false );
const showCreateRecipeModal = ref( false );
const creatingRecipe = ref( false );
const ingredientsCatalogResults = ref<Ingredient[]>( [] );
const existingIngredientQuery = ref( "" );
const catalogSearchLoading = ref( false );
const catalogSearchError = ref( "" );
let catalogSearchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
const newRecipeForm = reactive( {
  name: "",
  description: "",
  ingredientsText: "",
  isSpecial: false,
} );
const recipeForm = reactive( {
  name: "",
  description: "",
  is_special: false,
  special_kcal_reserved: 700,
} );

const ingredientById = computed( () =>
  new Map( ingredientsCatalogResults.value.map( ( ingredient ) => [ ingredient.id, ingredient ] ) ),
);

const filteredExistingIngredients = computed( () => {
  return ingredientsCatalogResults.value;
} );

const statusMeta = ( dish: DishRow ) => {
  const status = dish.recipe_status || "pending_ingredients";
  if ( status === "complete" )
    return { label: "Completa", color: "text-emerald-700" };
  if ( status === "not_required" )
    return { label: "No requiere ingredientes", color: "text-gray-500 dark:text-slate-400" };
  return { label: "Sugerida", color: "text-amber-700" };
};

const filteredDishes = computed( () =>
  dishes.value.filter( ( dish ) => {
    const query = searchTerm.value.trim().toLowerCase();
    if (
      query &&
      !String( dish.name || "" )
        .toLowerCase()
        .includes( query )
    ) {
      return false;
    }

    if ( showOnlyWithoutIngredients.value && ingredientCount( dish ) > 0 ) {
      return false;
    }

    if ( filter.value === "all" ) return true;
    if ( filter.value === "suggested" )
      return (
        dish.recipe_status === "suggested_ingredients" ||
        dish.recipe_status === "pending_ingredients" ||
        dish.recipe_status === "incomplete_nutrition"
      );
    if ( filter.value === "complete" ) return dish.recipe_status === "complete";
    if ( filter.value === "not_required" ) return dish.recipe_status === "not_required";
    return true;
  } ),
);

const allFilteredSelected = computed( () => {
  if ( filteredDishes.value.length === 0 ) return false;
  return filteredDishes.value.every( ( dish ) =>
    selectedDishIds.value.includes( dish.id ),
  );
} );

const ingredientCount = ( dish: DishRow ) =>
  ( dish.recipe_ingredients || [] ).length;

const hasIncompleteNutrition = ( ingredient?: Ingredient | null ) => {
  if ( !ingredient ) return true;
  return (
    ingredient.nutrition_status !== "complete" ||
    ingredient.kcal_per_100g == null ||
    ingredient.protein_per_100g == null ||
    ingredient.carbs_per_100g == null ||
    ingredient.fat_per_100g == null
  );
};

const recipeBlockers = ( dish: DishRow ) => {
  const rows = dish.recipe_ingredients || [];
  const blockers: Array<{ name: string; reason: "missing_ingredient_link" | "missing_nutrition" }> = [];
  for ( const row of rows ) {
    if ( !row.is_confirmed ) continue;
    const rowName = String( row.name || "" ).trim() || "(sin nombre)";
    if ( !row.ingredient_id ) {
      blockers.push( { name: rowName, reason: "missing_ingredient_link" } );
      continue;
    }
    if ( hasIncompleteNutrition( row.ingredients || null ) ) {
      blockers.push( { name: rowName, reason: "missing_nutrition" } );
    }
  }
  return blockers;
};

const recipeBlockersCount = ( dish: DishRow ) => recipeBlockers( dish ).length;

const goToIngredientsWithSearch = async ( ingredientName: string ) => {
  const query = String( ingredientName || "" ).trim();
  if ( !query ) {
    await router.push( "/ingredients" );
    return;
  }
  await router.push( {
    path: "/ingredients",
    query: { q: query },
  } );
};

const linkMissingIngredientInRecipe = async ( dishId: string, ingredientName: string ) => {
  const normalized = normalizeIngredientName( ingredientName || "" );
  if ( !normalized ) return;
  try {
    const ingredientId = await upsertMasterIngredient( ingredientName, "g" );
    if ( !ingredientId ) {
      appToast.error( "No se pudo vincular el ingrediente al catálogo." );
      return;
    }

    const { error } = await supabase
      .from( "recipe_ingredients" )
      .update( {
        ingredient_id: ingredientId,
        normalized_name: normalized,
        is_confirmed: true,
        is_suggested: false,
      } )
      .eq( "recipe_id", dishId )
      .eq( "normalized_name", normalized );
    if ( error ) throw error;

    await syncRecipeStatus( dishId );
    if ( editingDishId.value === dishId ) {
      await refreshEditingDish( dishId );
    }
    await loadRecipes();
    appToast.success( `Ingrediente "${ ingredientName }" vinculado.` );
  } catch ( error ) {
    await logError( "web", error, {
      context: "recipes.linkMissingIngredientInRecipe",
      dishId,
      ingredientName,
    } );
    appToast.fromError( "No se pudo vincular el ingrediente.", error );
  }
};

const isRecipeSaving = ( dishId: string ) =>
  savingDishIds.value.includes( dishId );

const loadRecipes = async () => {
  const currentUser = await loadCurrentUser();
  if ( !currentUser ) return;
  const { data, error } = await supabase
    .from( "dishes" )
    .select( "*, recipe_ingredients(*, ingredients(*))" )
    .eq( "user_id", currentUser.id )
    .order( "created_at", { ascending: false } );
  if ( error ) {
    await logError( "web", error, { context: "recipes.loadRecipes" } );
    return;
  }
  dishes.value = ( data || [] ) as DishRow[];
  selectedDishIds.value = selectedDishIds.value.filter( ( id ) =>
    dishes.value.some( ( dish ) => dish.id === id ),
  );
};

const openRecipeFromRoute = async () => {
  const recipeId = String( route.query.recipe || "" ).trim();
  if ( !recipeId || editingDishId.value === recipeId ) return;
  const dish = dishes.value.find( ( item ) => item.id === recipeId );
  if ( !dish ) return;
  searchTerm.value = dish.name || "";
  await toggleEdit( recipeId );
};

const createRecipeManual = async () => {
  if ( !newRecipeForm.name.trim() ) return;
  const currentUser = await loadCurrentUser();
  if ( !currentUser ) return;

  creatingRecipe.value = true;
  try {
    const normalizedName = normalizeIngredientName( newRecipeForm.name );
    const status = newRecipeForm.isSpecial
      ? "not_required"
      : "pending_ingredients";

    const { data: createdDish, error: dishError } = await supabase
      .from( "dishes" )
      .insert( {
        user_id: currentUser.id,
        name: newRecipeForm.name.trim(),
        normalized_name: normalizedName,
        description: newRecipeForm.description.trim() || null,
        recipe_status: status,
        is_special: Boolean( newRecipeForm.isSpecial ),
        special_kcal_reserved: newRecipeForm.isSpecial ? 700 : 0,
      } )
      .select( "id" )
      .single();

    if ( dishError || !createdDish?.id ) {
      throw dishError || new Error( "No se pudo crear la receta" );
    }

    const ingredientLines = newRecipeForm.ingredientsText
      .split( /\r?\n/g )
      .map( ( line ) => line.trim() )
      .filter( Boolean );

    if ( ingredientLines.length > 0 ) {
      const ingredientRows = ingredientLines.map( ( name ) => ( {
        recipe_id: createdDish.id,
        name,
        normalized_name: normalizeIngredientName( name ),
        quantity: 1,
        unit_type: "g",
        is_confirmed: true,
      } ) );

      const sanitizedIngredientRows = ingredientRows.map( ( row ) => ( {
        recipe_id: row.recipe_id,
        name: row.name,
        normalized_name: row.normalized_name,
        quantity: row.quantity,
        unit_type: row.unit_type,
        is_confirmed: row.is_confirmed,
      } ) );

      const { error: ingredientsError } = await supabase
        .from( "recipe_ingredients" )
        .insert( sanitizedIngredientRows );
      if ( ingredientsError ) throw ingredientsError;
    }

    showCreateRecipeModal.value = false;
    newRecipeForm.name = "";
    newRecipeForm.description = "";
    newRecipeForm.ingredientsText = "";
    newRecipeForm.isSpecial = false;

    await loadRecipes();
    await toggleEdit( createdDish.id );
    appToast.success( "Receta creada correctamente." );
  } catch ( error ) {
    await logError( "web", error, { context: "recipes.createRecipeManual" } );
    appToast.fromError( "No se pudo crear la receta.", error );
  } finally {
    creatingRecipe.value = false;
  }
};

const refreshEditingDish = async ( dishId: string ) => {
  const { data, error } = await supabase
    .from( "dishes" )
    .select( "*, recipe_ingredients(*, ingredients(*))" )
    .eq( "id", dishId )
    .maybeSingle();

  if ( error || !data ) {
    await logError( "web", error || new Error( "Receta no encontrada" ), {
      context: "recipes.refreshEditingDish",
    } );
    return;
  }

  const currentIndex = dishes.value.findIndex( ( dish ) => dish.id === dishId );
  if ( currentIndex >= 0 ) {
    dishes.value[ currentIndex ] = data as DishRow;
  } else {
    dishes.value.unshift( data as DishRow );
  }

  const dish = data as DishRow;
  recipeForm.name = dish.name || "";
  recipeForm.description = dish.description || "";
  recipeForm.is_special = Boolean( dish.is_special );
  recipeForm.special_kcal_reserved = Number( dish.special_kcal_reserved || 700 );
  pendingRows.value = ( dish.recipe_ingredients || [] )
    .filter( ( row ) => !row.is_confirmed )
    .map( ( row ) => ( { ...row, unit_type: row.unit_type || "g" } ) );
  confirmedRows.value = ( dish.recipe_ingredients || [] )
    .filter( ( row ) => row.is_confirmed )
    .map( ( row ) => ( { ...row, unit_type: row.unit_type || "g" } ) );
};

const isDishSelected = ( dishId: string ) =>
  selectedDishIds.value.includes( dishId );

const toggleDishSelected = ( dishId: string ) => {
  if ( isDishSelected( dishId ) ) {
    selectedDishIds.value = selectedDishIds.value.filter( ( id ) => id !== dishId );
    return;
  }
  selectedDishIds.value.push( dishId );
};

const toggleSelectAllFiltered = () => {
  const filteredIds = filteredDishes.value.map( ( dish ) => dish.id );
  if ( filteredIds.length === 0 ) return;

  if ( allFilteredSelected.value ) {
    selectedDishIds.value = selectedDishIds.value.filter(
      ( id ) => !filteredIds.includes( id ),
    );
    return;
  }

  selectedDishIds.value = Array.from(
    new Set( [ ...selectedDishIds.value, ...filteredIds ] ),
  );
};

const clearSelection = () => {
  selectedDishIds.value = [];
};

const saveRecipeQuick = async ( dishId: string, notify = true ) => {
  if ( isRecipeSaving( dishId ) ) return;
  savingDishIds.value.push( dishId );
  formError.value = "";
  try {
    await syncRecipeStatus( dishId );
    if ( editingDishId.value === dishId ) {
      await refreshEditingDish( dishId );
    }
    if ( notify ) {
      appToast.success( "Receta guardada." );
    }
  } catch ( error ) {
    await logError( "web", error, { context: "recipes.saveRecipeQuick" } );
    formError.value = "No se pudo guardar la receta.";
    if ( notify ) {
      appToast.fromError( "No se pudo guardar la receta.", error );
    }
    throw error;
  } finally {
    savingDishIds.value = savingDishIds.value.filter( ( id ) => id !== dishId );
  }
};

const saveSelectedRecipes = async () => {
  if ( selectedDishIds.value.length === 0 || savingSelectedRecipes.value ) return;
  savingSelectedRecipes.value = true;
  formError.value = "";
  const total = selectedDishIds.value.length;
  let savedCount = 0;
  try {
    for ( const dishId of selectedDishIds.value ) {
      try {
        await saveRecipeQuick( dishId, false );
        savedCount += 1;
      } catch {
        // Error already logged in saveRecipeQuick; continue remaining recipes.
      }
    }
    if ( savedCount === total ) {
      appToast.success( `Se guardaron ${ total } recetas.` );
      return;
    }
    if ( savedCount > 0 ) {
      appToast.error( `Se guardaron ${ savedCount } de ${ total } recetas.` );
      return;
    }
    appToast.error( "No se pudo guardar ninguna receta." );
  } finally {
    savingSelectedRecipes.value = false;
  }
};

const mergeCandidates = computed( () =>
  dishes.value.filter( ( dish ) => selectedDishIds.value.includes( dish.id ) ),
);

const openMergePanel = () => {
  if ( selectedDishIds.value.length < 2 ) return;
  showMergePanel.value = true;
  mergeTargetId.value = selectedDishIds.value[ 0 ] || "";
  const target = dishes.value.find( ( dish ) => dish.id === mergeTargetId.value );
  mergeFinalName.value = target?.name || "";
};

const cancelMergePanel = () => {
  showMergePanel.value = false;
  mergeTargetId.value = "";
  mergeFinalName.value = "";
};

const normalizeSplitParts = ( rawParts: string[] ) => {
  return Array.from(
    new Set(
      rawParts
        .map( ( part ) => part.trim() )
        .filter( Boolean )
        .map( ( part ) => part.replace( /\s+/g, " " ) ),
    ),
  );
};

const extractSplitCandidates = ( dishName: string ) => {
  const normalized = dishName
    .replace( /\s+\+\s+/g, " + " )
    .replace( /\s+y\s+de\s+segundo\s+/gi, " + " )
    .replace( /\s+de\s+segundo\s+/gi, " + " )
    .replace( /\s+primero:\s*/gi, "" )
    .replace( /\s+segundo:\s*/gi, " + " );
  const byPlus = normalized.split( "+" );
  return normalizeSplitParts( byPlus );
};

const openSplitPanel = ( dish: DishRow ) => {
  splitSourceDish.value = dish;
  splitCandidates.value = extractSplitCandidates( String( dish.name || "" ) );
  showSplitPanel.value = true;
};

const closeSplitPanel = () => {
  showSplitPanel.value = false;
  splitSourceDish.value = null;
  splitCandidates.value = [];
};

const updateOpenDishRows = () => {
  if ( !editingDishId.value ) return;
  const dish = dishes.value.find( ( row ) => row.id === editingDishId.value );
  if ( !dish ) return;
  dish.recipe_ingredients = [
    ...pendingRows.value.map( ( row ) => ( { ...row } ) ),
    ...confirmedRows.value.map( ( row ) => ( { ...row } ) ),
  ] as any;
};

const saveRecipeMeta = async ( dishId: string ) => {
  formError.value = "";
  if ( !recipeForm.name.trim() ) {
    formError.value = "El nombre de la receta no puede estar vacío.";
    return false;
  }
  const { error } = await supabase
    .from( "dishes" )
    .update( {
      name: recipeForm.name.trim(),
      normalized_name: normalizeIngredientName( recipeForm.name ),
      description: recipeForm.description.trim() || null,
      is_special: Boolean( recipeForm.is_special ),
      special_kcal_reserved: Math.max(
        0,
        Math.min( 2000, Number( recipeForm.special_kcal_reserved ) || 700 ),
      ),
    } )
    .eq( "id", dishId );
  if ( error ) {
    formError.value = error.message;
    await logError( "web", error, { context: "recipes.saveRecipeMeta" } );
    return false;
  }
  const dish = dishes.value.find( ( row ) => row.id === dishId );
  if ( dish ) {
    dish.name = recipeForm.name.trim();
    dish.description = recipeForm.description.trim() || undefined;
    dish.is_special = Boolean( recipeForm.is_special );
    dish.special_kcal_reserved = Math.max(
      0,
      Math.min( 2000, Number( recipeForm.special_kcal_reserved ) || 700 ),
    );
  }
  appToast.success( "Datos de receta guardados." );
  return true;
};

const searchIngredientsCatalog = async () => {
  const query = existingIngredientQuery.value.trim();
  if ( query.length < 2 ) {
    ingredientsCatalogResults.value = [];
    catalogSearchError.value = "";
    catalogSearchLoading.value = false;
    return;
  }
  catalogSearchLoading.value = true;
  catalogSearchError.value = "";
  try {
    const payload = await $fetch<{ success: boolean; ingredients?: Ingredient[] }>(
      "/api/ingredients-catalog-search",
      {
        method: "GET",
        query: {
          query,
          limit: 8,
        },
      },
    );
    ingredientsCatalogResults.value = Array.isArray( payload?.ingredients )
      ? payload.ingredients
      : [];
  } catch ( error ) {
    ingredientsCatalogResults.value = [];
    catalogSearchError.value = "No se pudo buscar en catálogo.";
    await logError( "web", error, {
      context: "recipes.searchIngredientsCatalog",
    } );
  } finally {
    catalogSearchLoading.value = false;
  }
};

const addExistingIngredientToRecipe = ( dishId: string, ingredient: Ingredient ) => {
  const normalized = normalizeIngredientName( ingredient.name || "" );
  if ( !normalized ) return;
  const alreadyExists = [ ...pendingRows.value, ...confirmedRows.value ].some(
    ( row ) => normalizeIngredientName( row.name || "" ) === normalized,
  );
  if ( alreadyExists ) {
    formError.value = `El ingrediente "${ ingredient.name }" ya existe en la receta.`;
    return;
  }

  const draftRow: RecipeIngredient = {
    id: `draft-${ Date.now() }-${ Math.random().toString( 36 ).slice( 2, 8 ) }`,
    recipe_id: dishId,
    ingredient_id: ingredient.id,
    name: ingredient.name,
    normalized_name: normalized,
    quantity: 1,
    unit_type: ingredient.default_unit_type || ingredient.unit_type || "g",
    is_confirmed: true,
    is_suggested: false,
    needs_review: false,
    created_at: new Date().toISOString(),
  };
  confirmedRows.value.unshift( draftRow );
  existingIngredientQuery.value = "";
  ingredientsCatalogResults.value = [];
  formError.value = "";
  updateOpenDishRows();
};

const addExistingIngredientByQuery = ( dishId: string ) => {
  const normalizedQuery = normalizeIngredientName( existingIngredientQuery.value || "" );
  if ( !normalizedQuery ) return;
  const exact = ingredientsCatalogResults.value.find(
    ( ingredient ) =>
      normalizeIngredientName( ingredient.name || "" ) === normalizedQuery ||
      String( ingredient.normalized_name || "" ) === normalizedQuery,
  );
  if ( !exact ) {
    formError.value =
      "No encontré ese ingrediente en catálogo. Selecciónalo desde la lista sugerida.";
    return;
  }
  addExistingIngredientToRecipe( dishId, exact );
};

const hasDuplicateNormalizedInOpenRecipe = (
  rowId: string,
  normalizedName: string,
) => {
  if ( !normalizedName ) return false;
  return [ ...pendingRows.value, ...confirmedRows.value ].some(
    ( item ) =>
      item.id !== rowId &&
      normalizeIngredientName( item.name || "" ) === normalizedName,
  );
};

const saveRecipeForm = async ( dishId: string ) => {
  const metaSaved = await saveRecipeMeta( dishId );
  if ( !metaSaved ) return;
  await saveAllConfirmedRows( dishId );
};

const toggleEdit = async ( dishId: string ) => {
  formError.value = "";
  if ( editingDishId.value === dishId ) {
    editingDishId.value = null;
    pendingRows.value = [];
    confirmedRows.value = [];
    recipeForm.name = "";
    recipeForm.description = "";
    recipeForm.is_special = false;
    recipeForm.special_kcal_reserved = 700;
    bulkIngredientInput.value = "";
    existingIngredientQuery.value = "";
    ingredientsCatalogResults.value = [];
    catalogSearchError.value = "";
    if ( catalogSearchDebounceTimer ) {
      clearTimeout( catalogSearchDebounceTimer );
      catalogSearchDebounceTimer = null;
    }
    return;
  }
  editingDishId.value = dishId;
  await ensureRecipeIngredientLinks( dishId );
  await refreshEditingDish( dishId );
};

const ensureRecipeIngredientLinks = async ( dishId: string ) => {
  const { data: recipeRows } = await supabase
    .from( "recipe_ingredients" )
    .select( "*" )
    .eq( "recipe_id", dishId );

  const toLink = ( recipeRows || [] ).filter(
    ( row ) => row.is_confirmed && !row.ingredient_id && row.name,
  );
  if ( toLink.length === 0 ) return;

  for ( const row of toLink ) {
    const ingredientId = await upsertMasterIngredient(
      row.name,
      row.unit_type || "g",
    );
    if ( !ingredientId ) continue;
    await supabase
      .from( "recipe_ingredients" )
      .update( {
        ingredient_id: ingredientId,
        normalized_name: normalizeIngredientName( row.name ),
      } )
      .eq( "id", row.id );
  }
};

const upsertMasterIngredient = async ( name: string, unitType: string ) => {
  const normalizedName = normalizeIngredientName( name );
  const existing = await supabase
    .from( "ingredients" )
    .select( "id" )
    .eq( "normalized_name", normalizedName )
    .maybeSingle();
  if ( existing.data?.id ) return existing.data.id;

  const created = await supabase
    .from( "ingredients" )
    .insert( {
      name,
      normalized_name: normalizedName,
      default_unit_type: unitType,
      unit_type: unitType,
      source: "manual",
      is_verified: false,
    } )
    .select( "id" )
    .single();
  return created.data?.id || null;
};

const openCandidateSearch = ( row: RecipeIngredient ) => {
  candidateTargetRowId.value = row.id;
  candidateQuery.value = row.name || "";
  candidateResults.value = [];
};

const searchCandidatesForTarget = async () => {
  if ( !candidateTargetRowId.value || !candidateQuery.value.trim() ) return;
  candidateLoading.value = true;
  try {
    const payload = await $fetch<{
      success: boolean;
      candidates?: any[];
    }>( "/api/ingredient-search", {
      method: "POST",
      body: {
        query: candidateQuery.value.trim(),
        source: candidateSource.value,
      },
    } );
    candidateResults.value = Array.isArray( payload?.candidates )
      ? payload.candidates
      : [];
  } catch ( error ) {
    await logError( "web", error, {
      context: "recipes.searchCandidatesForTarget",
    } );
  } finally {
    candidateLoading.value = false;
  }
};

const removeDuplicateSuggestedRows = async (
  dishId: string,
  row: RecipeIngredient,
) => {
  const normalizedName = normalizeIngredientName( row.name || "" );
  if ( !normalizedName ) return;

  const duplicateRows = pendingRows.value.filter(
    ( item ) =>
      item.id !== row.id &&
      normalizeIngredientName( item.name || "" ) === normalizedName,
  );
  if ( duplicateRows.length === 0 ) return;

  const duplicateIds = duplicateRows.map( ( item ) => item.id );
  const { error } = await supabase
    .from( "recipe_ingredients" )
    .delete()
    .in( "id", duplicateIds );
  if ( error ) throw error;

  pendingRows.value = pendingRows.value.filter(
    ( item ) => !duplicateIds.includes( item.id ),
  );
  const dish = dishes.value.find( ( item ) => item.id === dishId );
  if ( dish?.recipe_ingredients ) {
    dish.recipe_ingredients = dish.recipe_ingredients.filter(
      ( item ) => !duplicateIds.includes( item.id ),
    );
  }
};

const saveIngredientFromCandidate = async (
  candidate: any,
  row: RecipeIngredient,
) => {
  try {
    const result = await persistCandidate( candidate );
    if ( !result?.success || !result.ingredient_id ) {
      throw new Error( "No se pudo guardar el candidato" );
    }
    const name = row.name || candidate.name;
    const normalizedName = normalizeIngredientName( name );
    const { error } = await supabase
      .from( "recipe_ingredients" )
      .update( {
        ingredient_id: result.ingredient_id,
        name,
        normalized_name: normalizedName,
        unit_type: row.unit_type || "g",
        quantity: row.quantity ?? 1,
        is_confirmed: true,
        is_suggested: false,
        needs_review: false,
      } )
      .eq( "id", row.id );
    if ( error ) throw error;

    row.ingredient_id = result.ingredient_id;
    row.name = name;
    row.normalized_name = normalizedName;
    row.unit_type = row.unit_type || "g";
    row.quantity = row.quantity ?? 1;
    row.is_confirmed = true;
    row.is_suggested = false;
    row.needs_review = false;
    await removeDuplicateSuggestedRows( row.recipe_id, row );
    await syncRecipeStatus( row.recipe_id );
    pendingRows.value = pendingRows.value.filter( ( item ) => item.id !== row.id );
    const confirmedIndex = confirmedRows.value.findIndex(
      ( item ) => item.id === row.id,
    );
    if ( confirmedIndex >= 0 ) {
      confirmedRows.value[ confirmedIndex ] = { ...row };
    } else {
      confirmedRows.value.unshift( { ...row } );
    }
    updateOpenDishRows();
    candidateTargetRowId.value = null;
    candidateResults.value = [];
  } catch ( error ) {
    await logError( "web", error, {
      context: "recipes.saveIngredientFromCandidate",
    } );
  }
};

const hasCompleteNutrition = ( candidate: any ) =>
  [
    candidate?.nutrients?.kcal_per_100g,
    candidate?.nutrients?.protein_per_100g,
    candidate?.nutrients?.carbs_per_100g,
    candidate?.nutrients?.fat_per_100g,
  ].every( ( value ) => value != null );

const pickBestCandidate = ( candidates: any[] ) => {
  const fullAndHigh = candidates.filter(
    ( candidate ) =>
      candidate?.reliability === "high" && hasCompleteNutrition( candidate ),
  );
  if ( fullAndHigh.length > 0 ) return fullAndHigh[ 0 ];
  const fullAny = candidates.filter( ( candidate ) =>
    hasCompleteNutrition( candidate ),
  );
  return fullAny[ 0 ] || null;
};

const fetchCandidates = async (
  queryText: string,
  source: "usda" | "open_food_facts",
) => {
  const payload = await $fetch<{
    success: boolean;
    candidates?: any[];
  }>( "/api/ingredient-search", {
    method: "POST",
    body: {
      query: queryText.trim(),
      source,
    },
  } );
  return Array.isArray( payload?.candidates ) ? payload.candidates : [];
};

const autoApplyBestCandidate = async ( row: RecipeIngredient ) => {
  if ( !row.name?.trim() ) {
    formError.value =
      "El ingrediente debe tener nombre para buscar candidatos.";
    return;
  }

  formError.value = "";
  candidateLoading.value = true;
  try {
    const candidates = await fetchCandidates( row.name, "open_food_facts" );
    const bestCandidate = pickBestCandidate( candidates );

    if ( !bestCandidate ) {
      formError.value =
        "No encontré un candidato nutricional claro. Revisa manualmente con 'Buscar fuente'.";
      return;
    }

    await saveIngredientFromCandidate( bestCandidate, row );
  } catch ( error ) {
    await logError( "web", error, { context: "recipes.autoApplyBestCandidate" } );
    formError.value = "No se pudo aplicar el mejor candidato automáticamente.";
  } finally {
    candidateLoading.value = false;
  }
};

const syncRecipeStatus = async ( dishId: string ) => {
  const dish = dishes.value.find( ( row ) => row.id === dishId );
  if ( !dish ) return;
  if ( /^libre$/i.test( dish.name ) ) {
    await supabase
      .from( "dishes" )
      .update( { recipe_status: "not_required" } )
      .eq( "id", dishId );
    dish.recipe_status = "not_required";
    return;
  }

  const { data: recipeRows } = await supabase
    .from( "recipe_ingredients" )
    .select( "*, ingredients(*)" )
    .eq( "recipe_id", dishId );
  const hasSuggestedRows = ( recipeRows || [] ).some(
    ( row: any ) => !row.is_confirmed || row.is_suggested,
  );
  const confirmed = ( recipeRows || [] ).filter( ( row: any ) => row.is_confirmed );
  if ( confirmed.length === 0 ) {
    await supabase
      .from( "dishes" )
      .update( {
        recipe_status: "suggested_ingredients",
      } )
      .eq( "id", dishId );
    dish.recipe_status = "suggested_ingredients";
    return;
  }

  if ( hasSuggestedRows ) {
    await supabase
      .from( "dishes" )
      .update( {
        recipe_status: "pending_ingredients",
      } )
      .eq( "id", dishId );
    dish.recipe_status = "pending_ingredients";
    return;
  }

  await supabase
    .from( "dishes" )
    .update( {
      recipe_status: "complete",
    } )
    .eq( "id", dishId );
  dish.recipe_status = "complete";
};

const confirmRow = async ( dishId: string, row: RecipeIngredient ) => {
  formError.value = "";
  if ( !row.name || !row.unit_type ) {
    formError.value = "Para confirmar, indica nombre y unidad.";
    return;
  }
  const ingredientId = await upsertMasterIngredient( row.name, row.unit_type );
  if ( !ingredientId ) {
    formError.value = "No se pudo asociar el ingrediente maestro.";
    return;
  }
  const canonicalName =
    ( ingredientId && ingredientById.value.get( ingredientId )?.name ) || row.name;
  const canonicalNormalized = normalizeIngredientName( canonicalName );
  if ( hasDuplicateNormalizedInOpenRecipe( row.id, canonicalNormalized ) ) {
    formError.value =
      "Ya existe un ingrediente con ese nombre normalizado en esta receta.";
    return;
  }
  const { error } = await supabase
    .from( "recipe_ingredients" )
    .update( {
      ingredient_id: ingredientId,
      name: canonicalName,
      normalized_name: canonicalNormalized,
      quantity: 1,
      unit_type: row.unit_type,
      is_confirmed: true,
      is_suggested: false,
      needs_review: false,
    } )
    .eq( "id", row.id );
  if ( error ) {
    formError.value = error.message;
    await logError( "web", error, { context: "recipes.confirmRow" } );
    return;
  }
  await syncRecipeStatus( dishId );
  row.ingredient_id = ingredientId;
  row.name = canonicalName;
  row.normalized_name = canonicalNormalized;
  row.is_confirmed = true;
  row.is_suggested = false;
  pendingRows.value = pendingRows.value.filter( ( item ) => item.id !== row.id );
  confirmedRows.value.unshift( { ...row, quantity: 1, needs_review: false } );
  updateOpenDishRows();
};

const saveConfirmedRow = async ( dishId: string, row: RecipeIngredient ) => {
  formError.value = "";
  if ( !row.name || !row.unit_type ) {
    formError.value = "Ingrediente confirmado inválido: revisa nombre/unidad.";
    return;
  }
  const ingredientId = await upsertMasterIngredient( row.name, row.unit_type );
  if ( !ingredientId ) {
    formError.value = "No se pudo asociar el ingrediente maestro.";
    return;
  }
  const canonicalName =
    ( ingredientId && ingredientById.value.get( ingredientId )?.name ) || row.name;
  const canonicalNormalized = normalizeIngredientName( canonicalName );
  if ( hasDuplicateNormalizedInOpenRecipe( row.id, canonicalNormalized ) ) {
    formError.value =
      "Ya existe un ingrediente con ese nombre normalizado en esta receta.";
    return;
  }
  const payload = {
    recipe_id: dishId,
    ingredient_id: ingredientId,
    name: canonicalName,
    normalized_name: canonicalNormalized,
    quantity: 1,
    unit_type: row.unit_type,
    is_confirmed: true,
    is_suggested: false,
    needs_review: false,
    created_at: new Date().toISOString(),
  };
  const isDraftRow = String( row.id || "" ).startsWith( "draft-" );
  const { data, error } = isDraftRow
    ? await supabase
      .from( "recipe_ingredients" )
      .insert( payload )
      .select( "*" )
      .single()
    : await supabase
      .from( "recipe_ingredients" )
      .update( payload )
      .eq( "id", row.id )
      .select( "*" )
      .single();
  if ( error ) {
    formError.value = error.message;
    await logError( "web", error, { context: "recipes.saveConfirmedRow" } );
    return;
  }
  await syncRecipeStatus( dishId );
  const current = confirmedRows.value.find( ( item ) => item.id === row.id );
  if ( current ) {
    current.id = String( data?.id || row.id );
    current.name = canonicalName;
    current.unit_type = row.unit_type;
    current.ingredient_id = ingredientId;
    current.normalized_name = canonicalNormalized;
    current.recipe_id = dishId;
    current.is_confirmed = true;
    current.is_suggested = false;
    current.needs_review = false;
  }
  updateOpenDishRows();
};

const saveAllConfirmedRowsBatch = async ( dishId: string ) => {
  const rows = [ ...confirmedRows.value ].filter(
    (row) => row.name && row.unit_type,
  );
  if ( rows.length === 0 ) {
    formError.value = "No hay ingredientes confirmados válidos para guardar.";
    return;
  }

  const payloadRows = rows.map( ( row ) => ( {
    id: row.id,
    name: row.name,
    unit_type: row.unit_type,
  } ) );

  const response = await $fetch<{
    success: boolean;
    savedRows: RecipeIngredient[];
    createdIngredients: number;
    savedRecipeIngredients: number;
  }>( "/api/recipe-confirmed-ingredients-save", {
    method: "POST",
    body: {
      dishId,
      rows: payloadRows,
    },
  } );

  const savedRows = Array.isArray( response?.savedRows ) ? response.savedRows : [];
  confirmedRows.value = savedRows.map( ( row ) => ( {
    ...row,
    unit_type: row.unit_type || "g",
  } ) );
  updateOpenDishRows();
  await syncRecipeStatus( dishId );
  appToast.success(
    `Guardados ${ response?.savedRecipeIngredients || savedRows.length } ingredientes${
      ( response?.createdIngredients || 0 ) > 0
        ? ` · nuevos en catálogo: ${ response?.createdIngredients }`
        : ""
    }.`,
  );
};

const deleteRow = async ( dishId: string, rowId: string ) => {
  if ( String( rowId ).startsWith( "draft-" ) ) {
    pendingRows.value = pendingRows.value.filter( ( item ) => item.id !== rowId );
    confirmedRows.value = confirmedRows.value.filter( ( item ) => item.id !== rowId );
    updateOpenDishRows();
    return;
  }
  await supabase.from( "recipe_ingredients" ).delete().eq( "id", rowId );
  await syncRecipeStatus( dishId );
  pendingRows.value = pendingRows.value.filter( ( item ) => item.id !== rowId );
  confirmedRows.value = confirmedRows.value.filter( ( item ) => item.id !== rowId );
  updateOpenDishRows();
};

const addManualConfirmed = async ( dishId: string ) => {
  const baseName = "nuevo ingrediente";
  const existingNormalized = new Set(
    [ ...pendingRows.value, ...confirmedRows.value ]
      .map( ( row ) => normalizeIngredientName( row.name || "" ) )
      .filter( Boolean ),
  );

  let suffix = 1;
  let nameCandidate = baseName;
  while ( existingNormalized.has( normalizeIngredientName( nameCandidate ) ) ) {
    suffix += 1;
    nameCandidate = `${ baseName } ${ suffix }`;
  }

  const draftRow: RecipeIngredient = {
    id: `draft-${ Date.now() }-${ Math.random().toString( 36 ).slice( 2, 8 ) }`,
    recipe_id: dishId,
    ingredient_id: null,
    name: nameCandidate,
    normalized_name: normalizeIngredientName( nameCandidate ),
    quantity: 1,
    unit_type: "g",
    is_confirmed: true,
    is_suggested: false,
    needs_review: false,
    created_at: new Date().toISOString(),
  };
  confirmedRows.value.unshift( draftRow );
  updateOpenDishRows();
};

const confirmAllPendingRows = async ( dishId: string ) => {
  if ( pendingRows.value.length === 0 ) return;
  savingBatch.value = true;
  formError.value = "";
  try {
    const rows = [ ...pendingRows.value ];
    for ( const row of rows ) {
      await confirmRow( dishId, row );
    }
  } finally {
    savingBatch.value = false;
  }
};

const saveAllConfirmedRows = async ( dishId: string ) => {
  if ( confirmedRows.value.length === 0 ) return;
  savingBatch.value = true;
  formError.value = "";
  try {
    await saveAllConfirmedRowsBatch( dishId );
    await refreshEditingDish( dishId );
  } catch ( error ) {
    formError.value =
      error instanceof Error
        ? error.message
        : "No se pudieron guardar los ingredientes confirmados.";
    await logError( "web", error, { context: "recipes.saveAllConfirmedRows" } );
    appToast.fromError(
      "No se pudieron guardar los ingredientes confirmados.",
      error,
    );
  } finally {
    savingBatch.value = false;
  }
};

const deleteRecipe = async ( dishId: string ) => {
  const confirmed = await confirmDialog( {
    title: "Eliminar receta",
    message: "¿Eliminar esta receta y sus ingredientes?",
    confirmText: "Eliminar",
    danger: true,
  } );
  if ( !confirmed ) return;
  try {
    const { error } = await supabase.from( "dishes" ).delete().eq( "id", dishId );
    if ( error ) throw error;
    selectedDishIds.value = selectedDishIds.value.filter( ( id ) => id !== dishId );
    if ( editingDishId.value === dishId ) {
      editingDishId.value = null;
    }
    await loadRecipes();
    appToast.success( "Receta eliminada." );
  } catch ( error ) {
    await logError( "web", error, { context: "recipes.deleteRecipe" } );
    appToast.fromError( "No se pudo eliminar la receta.", error );
  }
};

const deleteSelectedRecipes = async () => {
  if ( selectedDishIds.value.length === 0 ) return;
  const confirmed = await confirmDialog( {
    title: "Eliminar recetas",
    message: `¿Eliminar ${ selectedDishIds.value.length } recetas?`,
    confirmText: "Eliminar",
    danger: true,
  } );
  if ( !confirmed ) return;
  try {
    const { error } = await supabase
      .from( "dishes" )
      .delete()
      .in( "id", selectedDishIds.value );
    if ( error ) throw error;
    selectedDishIds.value = [];
    editingDishId.value = null;
    await loadRecipes();
    appToast.success( "Recetas eliminadas correctamente." );
  } catch ( error ) {
    await logError( "web", error, { context: "recipes.deleteSelectedRecipes" } );
    appToast.fromError( "No se pudieron eliminar las recetas.", error );
  }
};

const mergeSelectedRecipes = async () => {
  if ( !mergeTargetId.value || selectedDishIds.value.length < 2 ) return;
  mergingRecipes.value = true;
  formError.value = "";
  try {
    const targetDish = dishes.value.find(
      ( dish ) => dish.id === mergeTargetId.value,
    );
    if ( !targetDish ) throw new Error( "Receta destino no encontrada" );

    const sourceIds = selectedDishIds.value.filter(
      ( id ) => id !== mergeTargetId.value,
    );
    const finalName = ( mergeFinalName.value || targetDish.name ).trim();
    if ( !finalName ) throw new Error( "Nombre final inválido" );

    const { data: targetRows } = await supabase
      .from( "recipe_ingredients" )
      .select( "*" )
      .eq( "recipe_id", mergeTargetId.value );
    const targetByNormalized = new Map(
      ( targetRows || [] ).map( ( row: any ) => [ String( row.normalized_name ), row ] ),
    );

    for ( const sourceId of sourceIds ) {
      const sourceDish = dishes.value.find( ( dish ) => dish.id === sourceId );
      const sourceName = sourceDish?.name?.trim();
      const { data: sourceRows } = await supabase
        .from( "recipe_ingredients" )
        .select( "*" )
        .eq( "recipe_id", sourceId );

      for ( const row of sourceRows || [] ) {
        const key = String( row.normalized_name || "" ).trim();
        if ( !key ) continue;
        const existing = targetByNormalized.get( key );
        if ( !existing ) {
          const { data: inserted, error: insertError } = await supabase
            .from( "recipe_ingredients" )
            .insert( {
              recipe_id: mergeTargetId.value,
              ingredient_id: row.ingredient_id || null,
              name: row.name,
              normalized_name: key,
              quantity: row.quantity ?? null,
              unit_type: row.unit_type ?? null,
              is_confirmed: !!row.is_confirmed,
              is_suggested: !!row.is_suggested,
              needs_review: !!row.needs_review,
            } )
            .select( "*" )
            .single();
          if ( insertError ) throw insertError;
          if ( inserted ) targetByNormalized.set( key, inserted );
          continue;
        }

        const needsUpgrade =
          ( !existing.is_confirmed && row.is_confirmed ) ||
          ( !existing.ingredient_id && row.ingredient_id ) ||
          ( existing.quantity == null && row.quantity != null ) ||
          ( !existing.unit_type && row.unit_type );
        if ( needsUpgrade ) {
          const { error: updateError } = await supabase
            .from( "recipe_ingredients" )
            .update( {
              ingredient_id:
                existing.ingredient_id || row.ingredient_id || null,
              quantity: existing.quantity ?? row.quantity ?? null,
              unit_type: existing.unit_type || row.unit_type || null,
              is_confirmed: Boolean( existing.is_confirmed || row.is_confirmed ),
              is_suggested: Boolean( existing.is_suggested && !row.is_confirmed ),
              needs_review: Boolean( existing.needs_review && row.needs_review ),
            } )
            .eq( "id", existing.id );
          if ( updateError ) throw updateError;
        }
      }

      if ( sourceName ) {
        await supabase
          .from( "weekly_meals" )
          .update( { dish_name: finalName } )
          .eq( "dish_name", sourceName );
        await supabase
          .from( "saved_fixed_meals" )
          .update( { dish_name: finalName } )
          .eq( "dish_name", sourceName );
        await supabase
          .from( "rotating_menu_meals" )
          .update( { dish_name: finalName } )
          .eq( "dish_name", sourceName );
      }

      const { error: deleteSourceError } = await supabase
        .from( "dishes" )
        .delete()
        .eq( "id", sourceId );
      if ( deleteSourceError ) throw deleteSourceError;
    }

    const { error: renameError } = await supabase
      .from( "dishes" )
      .update( {
        name: finalName,
        normalized_name: normalizeIngredientName( finalName ),
      } )
      .eq( "id", mergeTargetId.value );
    if ( renameError ) throw renameError;

    selectedDishIds.value = [];
    cancelMergePanel();
    await loadRecipes();
    appToast.success( "Recetas fusionadas correctamente." );
  } catch ( error ) {
    formError.value =
      error instanceof Error ? error.message : "No se pudo fusionar recetas";
    await logError( "web", error, { context: "recipes.mergeSelectedRecipes" } );
    appToast.fromError( "No se pudieron fusionar las recetas.", error );
  } finally {
    mergingRecipes.value = false;
  }
};

const splitRecipe = async () => {
  if ( !splitSourceDish.value ) return;
  splittingRecipe.value = true;
  formError.value = "";
  try {
    const currentUser = await loadCurrentUser();
    if ( !currentUser ) throw new Error( "Usuario no disponible" );

    const parts = normalizeSplitParts( splitCandidates.value ).filter(
      ( part ) => part.length >= 3,
    );
    if ( parts.length < 2 ) {
      throw new Error( "No hay suficientes partes para dividir la receta." );
    }

    const sourceRecipeId = splitSourceDish.value.id;
    const { data: sourceIngredients } = await supabase
      .from( "recipe_ingredients" )
      .select( "*" )
      .eq( "recipe_id", sourceRecipeId );

    const createdOrFound: Array<{ id: string; name: string }> = [];
    for ( const partName of parts ) {
      const normalized = normalizeIngredientName( partName );
      const { data: existing, error: existingError } = await supabase
        .from( "dishes" )
        .select( "id,name" )
        .eq( "user_id", currentUser.id )
        .eq( "normalized_name", normalized )
        .maybeSingle();
      if ( existingError ) throw existingError;

      if ( existing?.id ) {
        createdOrFound.push( { id: existing.id, name: existing.name } );
        continue;
      }

      const { data: insertedDish, error: insertError } = await supabase
        .from( "dishes" )
        .insert( {
          user_id: currentUser.id,
          name: partName,
          normalized_name: normalized,
          description: null,
          recipe_status: "suggested_ingredients",
          source: "manual",
          servings_base: 1,
        } )
        .select( "id,name" )
        .single();
      if ( insertError ) throw insertError;
      if ( insertedDish ) {
        createdOrFound.push( { id: insertedDish.id, name: insertedDish.name } );
      }
    }

    // Reparte sugerencias de ingredientes de la receta original en las nuevas partes
    for ( const targetDish of createdOrFound ) {
      const splitNameTokens = tokenize(
        normalizeIngredientName( targetDish.name ),
      );
      const candidates = ( sourceIngredients || [] ).filter( ( ingredient: any ) => {
        const ingredientTokens = tokenize(
          normalizeIngredientName( ingredient.name || "" ),
        );
        return ingredientTokens.some( ( token ) =>
          splitNameTokens.includes( token ),
        );
      } );
      if ( candidates.length === 0 ) continue;

      for ( const candidate of candidates ) {
        const normalizedName = normalizeIngredientName( candidate.name || "" );
        if ( !normalizedName ) continue;
        await supabase.from( "recipe_ingredients" ).upsert(
          {
            recipe_id: targetDish.id,
            ingredient_id: candidate.ingredient_id || null,
            name: candidate.name,
            normalized_name: normalizedName,
            quantity: candidate.quantity ?? 1,
            unit_type: candidate.unit_type || "g",
            is_confirmed: false,
            is_suggested: true,
            needs_review: true,
          },
          {
            onConflict: "recipe_id,normalized_name",
          },
        );
      }
    }

    closeSplitPanel();
    await loadRecipes();
    appToast.success( "Receta dividida correctamente." );
  } catch ( error ) {
    formError.value =
      error instanceof Error ? error.message : "No se pudo dividir la receta";
    await logError( "web", error, { context: "recipes.splitRecipe" } );
    appToast.fromError( "No se pudo dividir la receta.", error );
  } finally {
    splittingRecipe.value = false;
  }
};

const tokenize = ( value: string ) =>
  value
    .split( /[^a-z0-9]+/gi )
    .map( ( token ) => token.trim() )
    .filter( ( token ) => token.length >= 3 );

const addBulkIngredients = async ( dishId: string ) => {
  if ( !bulkIngredientInput.value.trim() ) return;
  savingBulkIngredients.value = true;
  formError.value = "";
  try {
    const parsedRows = bulkIngredientInput.value
      .split( "\n" )
      .map( ( line ) => line.trim() )
      .filter( Boolean )
      .map( ( line ) => {
        const normalized = normalizeIngredientName( line );
        return {
          recipe_id: dishId,
          ingredient_id: null,
          name: line,
          normalized_name: normalized,
          quantity: 1,
          unit_type: "g",
          is_confirmed: true,
          is_suggested: false,
          needs_review: false,
        };
      } )
      .filter( ( row ) => row.normalized_name );

    if ( parsedRows.length === 0 ) {
      formError.value = "No se encontraron ingredientes válidos para añadir.";
      return;
    }

    const dedupedRows = Array.from(
      new Map( parsedRows.map( ( row ) => [ row.normalized_name, row ] ) ).values(),
    );

    const { error } = await supabase
      .from( "recipe_ingredients" )
      .upsert( dedupedRows, {
        onConflict: "recipe_id,normalized_name",
      } );
    if ( error ) throw error;

    await syncRecipeStatus( dishId );
    await refreshEditingDish( dishId );
    bulkIngredientInput.value = "";
    appToast.success( "Ingredientes añadidos correctamente." );
  } catch ( error ) {
    formError.value =
      error instanceof Error ? error.message : "Error añadiendo ingredientes";
    await logError( "web", error, { context: "recipes.addBulkIngredients" } );
    appToast.fromError( "No se pudieron añadir los ingredientes.", error );
  } finally {
    savingBulkIngredients.value = false;
  }
};

onMounted( async () => {
  await loadRecipes();
  await openRecipeFromRoute();
} );

watch(
  existingIngredientQuery,
  () => {
    if ( catalogSearchDebounceTimer ) {
      clearTimeout( catalogSearchDebounceTimer );
    }
    catalogSearchDebounceTimer = setTimeout( () => {
      searchIngredientsCatalog();
    }, 220 );
  },
);

watch(
  () => route.query.recipe,
  async () => {
    await openRecipeFromRoute();
  },
);
</script>
