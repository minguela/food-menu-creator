<template>
  <div class="space-y-6">
    <header class="ui-surface rounded-2xl p-5">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p class="ui-kicker">Ingredientes</p>
          <h1 class="mt-1 text-2xl font-semibold text-[var(--text-1)]">Expansiones</h1>
          <p class="mt-1 text-sm ui-muted">Reglas para anadir ingredientes automaticamente en platos OCR.</p>
        </div>
        <div class="flex items-center gap-2">
          <NuxtLink href="/ingredients" class="rounded-2xl border border-white/25 px-4 py-2 text-sm text-[var(--text-1)] hover:bg-[rgba(255,255,255,0.08)]">
            Volver a ingredientes
          </NuxtLink>
          <button class="rounded-2xl border border-white/40 bg-transparent/10 px-4 py-2 text-sm font-medium text-[var(--text-1)] hover:bg-white/20" @click="openExpansionModal()">
            Nueva expansion
          </button>
        </div>
      </div>
    </header>

    <section class="ui-surface rounded-2xl p-5">
      <div v-if="loadingExpansions" class="py-12 text-center ui-muted">Cargando expansiones...</div>
      <div v-else-if="expansionMappings.length === 0" class="py-12 text-center">
        <p class="text-base text-[var(--text-1)]">No hay expansiones definidas</p>
        <p class="mt-1 text-sm ui-muted">Crea tu primera regla para automatizar ingredientes.</p>
      </div>
      <div v-else class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <article v-for="m in expansionMappings" :key="m.id" class="ui-card rounded-xl p-4">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <h2 class="truncate text-base font-semibold text-[var(--text-1)]">{{ m.dish_name }}</h2>
                <span v-if="m.is_global" class="rounded-full border border-white/30 px-2 py-0.5 text-[11px] text-[var(--text-1)]/90">Global</span>
              </div>
              <p class="mt-1 truncate text-xs ui-subtle">{{ m.aliases?.length ? m.aliases.join(', ') : 'Sin alias' }}</p>
            </div>
            <div class="flex items-center gap-1">
              <button class="rounded-lg border border-white/20 px-2 py-1 text-xs text-[var(--text-1)] hover:bg-[rgba(255,255,255,0.08)]" @click="openExpansionModal(m)">Editar</button>
              <button class="rounded-lg border border-red-400/50 px-2 py-1 text-xs hover:bg-red-500/10" @click="deleteExpansion(m.id)">Borrar</button>
            </div>
          </div>
          <div class="mt-3 flex flex-wrap gap-1.5">
            <span v-for="(ing, i) in (m.ingredients || []).slice(0, 5)" :key="i" class="rounded-md border border-white/20 px-2 py-1 text-xs text-[var(--text-1)]/90">
              {{ ing.name }}
            </span>
            <span v-if="(m.ingredients?.length || 0) > 5" class="px-2 py-1 text-xs ui-muted">+{{ m.ingredients.length - 5 }} mas</span>
          </div>
        </article>
      </div>
    </section>

    <div v-if="showExpansionModal" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="showExpansionModal = false">
      <div class="absolute inset-0 bg-[var(--bg-canvas)]/70"></div>
      <div class="relative w-full max-w-xl rounded-2xl border border-white/15 bg-[var(--bg-canvas)] p-5">
        <h2 class="text-lg font-semibold text-[var(--text-1)]">{{ editingExpansion ? "Editar" : "Nueva" }} expansion</h2>
        <p class="mt-1 text-xs ui-muted">Configura nombre, alias e ingredientes en formato JSON.</p>

        <div class="mt-4 space-y-3">
          <input v-model="expansionForm.dishName" class="ui-input w-full px-3 py-2" placeholder="Nombre del plato" />
          <input v-model="expansionForm.aliases" class="ui-input w-full px-3 py-2" placeholder="Alias separados por coma" />
          <textarea v-model="expansionForm.ingredients" rows="6" class="ui-textarea w-full px-3 py-2 font-mono text-xs" placeholder='[{"name":"huevos","quantity":3,"unit_type":"ud"}]'></textarea>
          <label class="inline-flex items-center gap-2 text-sm ui-muted">
            <input v-model="expansionForm.isGlobal" type="checkbox" class="h-4 w-4" /> Regla global
          </label>
        </div>

        <div class="mt-5 flex justify-end gap-2">
          <button class="ui-btn-muted px-4 py-2 text-sm" @click="showExpansionModal = false">Cancelar</button>
          <button class="ui-btn-primary px-4 py-2 text-sm" @click="saveExpansion">{{ editingExpansion ? "Actualizar" : "Crear" }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCurrentUser } from "~/composables/useCurrentUser";
import { useAppToast } from "~/composables/use-app-toast";

const { loadCurrentUser } = useCurrentUser();
const appToast = useAppToast();
const { confirm: confirmDialog } = useConfirmDialog();

const showExpansionModal = ref(false);
const editingExpansion = ref<any>(null);
const expansionForm = ref({ dishName: "", aliases: "", ingredients: "[]", isGlobal: false });
const expansionMappings = ref<any[]>([]);
const loadingExpansions = ref(false);

const loadExpansions = async () => {
  const user = await loadCurrentUser();
  if (!user) return;
  loadingExpansions.value = true;
  try {
    const { data } = await useFetch("/api/ingredient-mappings", { query: { userId: user.id } });
    expansionMappings.value = data.value?.mappings || [];
  } finally {
    loadingExpansions.value = false;
  }
};

const openExpansionModal = (mapping?: any) => {
  if (mapping) {
    editingExpansion.value = mapping;
    expansionForm.value = {
      dishName: mapping.dish_name || "",
      aliases: (mapping.aliases || []).join(", "),
      ingredients: JSON.stringify(mapping.ingredients || [], null, 2),
      isGlobal: Boolean(mapping.is_global),
    };
  } else {
    editingExpansion.value = null;
    expansionForm.value = { dishName: "", aliases: "", ingredients: "[]", isGlobal: false };
  }
  showExpansionModal.value = true;
};

const saveExpansion = async () => {
  const user = await loadCurrentUser();
  if (!user) return;
  try {
    const parsedIngredients = JSON.parse(expansionForm.value.ingredients);
    const aliases = expansionForm.value.aliases.split(",").map((v: string) => v.trim()).filter(Boolean);
    const body = {
      userId: user.id,
      dishName: expansionForm.value.dishName,
      aliases,
      ingredients: parsedIngredients,
      isGlobal: expansionForm.value.isGlobal,
    };
    if (editingExpansion.value) {
      await useFetch("/api/ingredient-mappings", { method: "PUT", body: { id: editingExpansion.value.id, ...body } });
    } else {
      await useFetch("/api/ingredient-mappings", { method: "POST", body });
    }
    showExpansionModal.value = false;
    await loadExpansions();
    appToast.success(editingExpansion.value ? "Expansion actualizada." : "Expansion creada.");
  } catch (error: any) {
    appToast.error(error?.message || "Error guardando expansion.");
  }
};

const deleteExpansion = async (id: string) => {
  const confirmed = await confirmDialog({
    title: "Eliminar expansion",
    message: "¿Eliminar esta expansion?",
    confirmText: "Eliminar",
    danger: true,
  });
  if (!confirmed) return;

  const user = await loadCurrentUser();
  if (!user) return;
  try {
    await useFetch("/api/ingredient-mappings", { method: "DELETE", body: { id, userId: user.id } });
    await loadExpansions();
    appToast.success("Expansion eliminada.");
  } catch (error) {
    appToast.fromError("No se pudo eliminar la expansion.", error);
  }
};

onMounted(() => {
  loadExpansions();
});
</script>
