<template>
  <div class="min-h-screen bg-transparent text-text-1">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      <!-- Toast -->
      <div
        v-if="statusMessage"
        class="fixed right-4 top-4 z-50 px-5 py-3 rounded-2xl text-sm font-medium border shadow-lg backdrop-blur-lg"
        :class="statusType === 'error' ? 'bg-danger/15 text-danger border-danger/25' : 'bg-success/15 text-success border-[rgba(114,206,123,0.25)]'"
      >
        {{ statusMessage }}
      </div>

      <!-- Header -->
      <header class="flex items-center gap-5">
        <div class="w-14 h-14 rounded-2xl flex items-center justify-center"
          style="background: linear-gradient(135deg, rgba(187,222,242,0.18), rgba(209,170,215,0.14)); border: 1px solid rgba(255,255,255,0.08);">
          <svg class="w-7 h-7 text-text-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div>
          <h1 class="text-[26px] font-light font-['Montserrat'] tracking-[-0.01em] text-text-1">
            Perfiles
          </h1>
          <p class="text-sm text-text-3 mt-1">
            Define objetivos nutricionales por persona con porcentajes de macronutrientes
          </p>
        </div>
      </header>

      <!-- Form Section -->
      <section class="ui-surface p-6 sm:p-8">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-lg font-light font-['Montserrat'] tracking-[-0.01em] text-text-1">
            {{ profileForm.id ? "Editar perfil" : "Nuevo perfil" }}
          </h2>
          <button v-if="profileForm.id" @click="resetProfileForm"
            class="text-sm text-text-3 hover:text-text-1 transition-colors">
            Cancelar
          </button>
        </div>

        <form @submit.prevent="saveProfile" class="space-y-6">
          <!-- Basic info row -->
          <div class="grid gap-4 sm:grid-cols-5">
            <label class="sm:col-span-2 space-y-1.5">
              <span class="block text-xs font-medium tracking-[0.08em] uppercase text-text-3">Nombre</span>
              <input
                v-model.trim="profileForm.name"
                class="w-full rounded-xl px-4 py-2.5 text-sm bg-surface-3 border border-border-soft text-text-1 placeholder:text-text-3 focus:border-[var(--accent)] focus:ring-1 focus:ring-accent outline-none"
                placeholder="Ej. David"
                required
              />
            </label>
            <label class="space-y-1.5">
              <span class="block text-xs font-medium tracking-[0.08em] uppercase text-text-3">Sexo</span>
              <select
                v-model="profileForm.sex"
                class="w-full rounded-xl px-4 py-2.5 text-sm bg-surface-3 border border-border-soft text-text-1 focus:border-[var(--accent)] focus:ring-1 focus:ring-accent outline-none appearance-none"
              >
                <option value="female">Mujer</option>
                <option value="male">Hombre</option>
                <option value="other">Otro</option>
              </select>
            </label>
            <label class="space-y-1.5">
              <span class="block text-xs font-medium tracking-[0.08em] uppercase text-text-3">Edad</span>
              <input
                v-model.number="profileForm.age"
                type="number" min="1" max="120"
                class="w-full rounded-xl px-4 py-2.5 text-sm bg-surface-3 border border-border-soft text-text-1 placeholder:text-text-3 focus:border-[var(--accent)] focus:ring-1 focus:ring-accent outline-none"
                placeholder="35"
                required
              />
            </label>
            <label class="space-y-1.5">
              <span class="block text-xs font-medium tracking-[0.08em] uppercase text-text-3">kcal/día</span>
              <input
                v-model.number="profileForm.daily_kcal_target"
                type="number" min="800" max="6000" step="50"
                class="w-full rounded-xl px-4 py-2.5 text-sm bg-surface-3 border border-border-soft text-text-1 placeholder:text-text-3 focus:border-[var(--accent)] focus:ring-1 focus:ring-accent outline-none"
                placeholder="1900"
                required
              />
            </label>
          </div>

          <!-- Macros row -->
          <div class="pt-2">
            <p class="text-xs font-medium tracking-[0.08em] uppercase text-text-3 mb-4">Distribucion de macros (%)</p>
            <div class="grid gap-4 sm:grid-cols-4 items-end">
              <label class="space-y-1.5">
                <span class="block text-xs text-text-3">Hidratos</span>
                <div class="relative">
                  <input
                    v-model.number="profileForm.carbs_pct_target"
                    type="number" min="5" max="80" step="1"
                    class="w-full rounded-xl px-4 py-2.5 pr-10 text-sm bg-surface-3 border border-border-soft text-text-1 placeholder:text-text-3 focus:border-[var(--accent)] focus:ring-1 focus:ring-accent outline-none"
                    placeholder="45"
                    required
                  />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-3">%</span>
                </div>
              </label>
              <label class="space-y-1.5">
                <span class="block text-xs text-text-3">Grasas</span>
                <div class="relative">
                  <input
                    v-model.number="profileForm.fat_pct_target"
                    type="number" min="5" max="70" step="1"
                    class="w-full rounded-xl px-4 py-2.5 pr-10 text-sm bg-surface-3 border border-border-soft text-text-1 placeholder:text-text-3 focus:border-[var(--accent)] focus:ring-1 focus:ring-accent outline-none"
                    placeholder="30"
                    required
                  />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-3">%</span>
                </div>
              </label>

              <!-- Deduced protein -->
              <div class="space-y-1.5">
                <span class="block text-xs text-text-3">Proteína</span>
                <div
                  class="rounded-xl px-4 py-2.5 text-sm border"
                  :class="profileMacroValidation.valid ? 'bg-success/8 border-success/20 text-success' : 'bg-danger/6 border-danger/20 text-danger'"
                >
                  <span class="font-semibold">{{ profileForm.protein_pct_target }}%</span>
                  <span class="ml-1 text-xs opacity-60">deducida</span>
                </div>
              </div>

              <!-- Tolerance -->
              <label class="space-y-1.5">
                <span class="block text-xs text-text-3">Tolerancia</span>
                <div class="relative">
                  <input
                    v-model.number="profileForm.tolerance_percent"
                    type="number" min="0" max="50" step="1"
                    class="w-full rounded-xl px-4 py-2.5 pr-10 text-sm bg-surface-3 border border-border-soft text-text-1 placeholder:text-text-3 focus:border-[var(--accent)] focus:ring-1 focus:ring-accent outline-none"
                    placeholder="10"
                  />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-3">%</span>
                </div>
              </label>
            </div>
          </div>

          <!-- Macro gram summary -->
          <div
            v-if="profileForm.daily_kcal_target && profileMacroValidation.valid"
            class="rounded-2xl px-5 py-4 flex flex-wrap items-center gap-4 text-sm"
            style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-soft);"
          >
            <div class="flex-1 min-w-[140px]">
              <p class="text-xs tracking-[0.08em] uppercase text-text-3 mb-1">Equivalente en gramos</p>
              <p class="text-text-2">{{ profileMacroSummaryText }}</p>
            </div>
            <button
              type="button"
              v-if="profileForm.id && profileMacroValidation.valid"
              class="text-sm px-4 py-2 rounded-xl font-medium border border-[rgba(255,255,255,0.12)] text-text-2 hover:bg-white/6 disabled:opacity-40 transition-colors"
              :disabled="profileSaving"
              @click="saveProfileMacros"
            >
              Guardar solo macros
            </button>
          </div>
          <div
            v-if="!profileMacroValidation.valid && (profileForm.carbs_pct_target || profileForm.fat_pct_target)"
            class="rounded-xl px-4 py-3 text-sm bg-danger/6 border border-danger/20 text-danger"
          >
            {{ profileMacroValidation.message }}
          </div>

          <!-- Submit -->
          <div class="flex gap-3 pt-2">
            <button
              type="submit"
              :disabled="!profileFormValid || profileSaving"
              class="ui-btn-primary px-6 py-2.5 rounded-xl text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {{ profileSaving ? "Guardando..." : profileForm.id ? "Actualizar perfil" : "Crear perfil" }}
            </button>
          </div>
        </form>
      </section>

      <!-- Profile List -->
      <section class="ui-surface p-6 sm:p-8">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-lg font-light font-['Montserrat'] tracking-[-0.01em] text-text-1">
              Lista de perfiles
            </h2>
            <p class="text-sm text-text-3 mt-1">
              {{ profiles.length }} {{ profiles.length === 1 ? "perfil" : "perfiles" }}
            </p>
          </div>
        </div>

        <div
          v-if="profiles.length === 0"
          class="rounded-xl border border-dashed border-border-strong px-5 py-8 text-center text-sm text-text-3"
        >
          Crea tu primer perfil usando el formulario superior para empezar.
        </div>

        <div v-else class="space-y-3">
          <article
            v-for="profile in profiles"
            :key="profile.id"
            class="rounded-2xl px-5 py-4 border border-border-soft transition-colors hover:border-[rgba(255,255,255,0.16)]"
            style="background: rgba(255,255,255,0.02);"
          >
            <div class="flex flex-wrap items-center justify-between gap-4">
              <div class="flex-1 min-w-[200px]">
                <div class="flex items-center gap-3 mb-2">
                  <h3 class="text-base font-medium text-text-1">{{ profile.name }}</h3>
                  <span class="text-xs text-text-3">
                    {{ sexLabel(profile.sex) }} · {{ profile.age }}a
                  </span>
                </div>

                <div class="flex flex-wrap gap-x-5 gap-y-1 text-sm">
                  <span class="text-text-2">
                    <span class="text-text-3">kcal</span> {{ profile.daily_kcal_target }}
                  </span>
                  <span class="text-text-2">
                    <span class="text-text-3">HC</span> {{ profile.carbs_pct_target }}%
                  </span>
                  <span class="text-text-2">
                    <span class="text-text-3">G</span> {{ profile.fat_pct_target }}%
                  </span>
                  <span class="text-text-2">
                    <span class="text-text-3">P</span> {{ profile.protein_pct_target ?? (100 - (profile.carbs_pct_target || 0) - (profile.fat_pct_target || 0)) }}%
                  </span>
                </div>

                <p class="text-xs text-text-3 mt-2">
                  {{ profileGramSummary(profile) }}
                </p>
              </div>

              <div class="flex gap-2 shrink-0">
                <button
                  @click="editProfile(profile)"
                  class="rounded-xl px-4 py-2 text-xs font-medium border border-border-soft text-text-2 hover:bg-white/6 transition-colors"
                >
                  Editar
                </button>
                <button
                  @click="deleteProfile(profile.id)"
                  class="rounded-xl px-4 py-2 text-xs font-medium border border-danger/20 text-danger hover:bg-danger/10 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </article>
        </div>
      </section>

    </div>
  </div>
</template>

<script setup lang="ts">
import {
  macroTargetsFromCalories,
  validateMacroTargets,
} from "~/utils/nutrition.js";
import type { PersonProfile } from "~/types";

const supabase = useSupabase();
const { user, loadCurrentUser } = useCurrentUser();
const { confirm: confirmDialog } = useConfirmDialog();

const profiles = ref<PersonProfile[]>([]);
const profileSaving = ref(false);
const statusMessage = ref("");
const statusType = ref<"success" | "error">("success");

type ProfileForm = {
  id: string;
  name: string;
  sex: "female" | "male" | "other";
  age: number;
  daily_kcal_target: number;
  carbs_pct_target: number;
  fat_pct_target: number;
  protein_pct_target: number;
  tolerance_percent: number;
};

const profileForm = ref<ProfileForm>({
  id: "",
  name: "",
  sex: "other",
  age: 35,
  daily_kcal_target: 1900,
  carbs_pct_target: 45,
  fat_pct_target: 30,
  protein_pct_target: 25,
  tolerance_percent: 10,
});

const profileMacroValidation = computed(() =>
  validateMacroTargets({
    fatPct: profileForm.value.fat_pct_target,
    carbsPct: profileForm.value.carbs_pct_target,
  }),
);

const profileMacroSummaryText = computed(() => {
  if (!profileForm.value.daily_kcal_target || !profileMacroValidation.value.valid) return "";
  const targets = macroTargetsFromCalories(profileForm.value.daily_kcal_target, {
    fatPct: profileForm.value.fat_pct_target,
    carbsPct: profileForm.value.carbs_pct_target,
  });
  return `${targets.protein_g}g proteína · ${targets.carbs_g}g hidratos · ${targets.fat_g}g grasas`;
});

const profileFormValid = computed(
  () =>
    Boolean(profileForm.value.name) &&
    profileForm.value.age >= 1 &&
    profileForm.value.age <= 120 &&
    profileForm.value.daily_kcal_target >= 800 &&
    profileForm.value.daily_kcal_target <= 6000 &&
    profileForm.value.carbs_pct_target >= 5 &&
    profileForm.value.carbs_pct_target <= 80 &&
    profileForm.value.fat_pct_target >= 5 &&
    profileForm.value.fat_pct_target <= 70 &&
    profileMacroValidation.value.valid &&
    profileForm.value.protein_pct_target >= 5 &&
    profileForm.value.protein_pct_target <= 50,
);

const profileGramSummary = (profile: PersonProfile) => {
  const proteinPct = profile.protein_pct_target ?? (100 - (profile.carbs_pct_target || 0) - (profile.fat_pct_target || 0));
  if (proteinPct <= 0) return "";
  const proteinG = Math.round((profile.daily_kcal_target * proteinPct) / 100 / 4 * 10) / 10;
  const carbsG = Math.round((profile.daily_kcal_target * (profile.carbs_pct_target || 0)) / 100 / 4 * 10) / 10;
  const fatG = Math.round((profile.daily_kcal_target * (profile.fat_pct_target || 0)) / 100 / 9 * 10) / 10;
  return `P ${proteinG}g · HC ${carbsG}g · G ${fatG}g · tol ${profile.tolerance_percent ?? 10}%`;
};

const showStatus = (message: string, type: "success" | "error" = "success") => {
  statusMessage.value = message;
  statusType.value = type;
  setTimeout(() => {
    statusMessage.value = "";
  }, 3000);
};

const loadData = async () => {
  const currentUser = await loadCurrentUser();
  if (!currentUser) {
    showStatus("No hay usuario configurado. Usa /start en Telegram primero.", "error");
    return;
  }

  const { data, error } = await supabase
    .from("person_profiles")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: true });

  if (error) {
    showStatus(`Error cargando perfiles: ${error.message}`, "error");
    return;
  }

  profiles.value = data || [];
};

const saveProfile = async () => {
  const currentUser = await loadCurrentUser();
  if (!currentUser || !profileFormValid.value) return;

  profileSaving.value = true;
  const proteinPct = profileForm.value.protein_pct_target;
  const proteinG = Math.round((profileForm.value.daily_kcal_target * proteinPct) / 100 / 4 * 10) / 10;
  const payload = {
    user_id: currentUser.id,
    name: profileForm.value.name,
    sex: profileForm.value.sex,
    age: profileForm.value.age,
    daily_kcal_target: profileForm.value.daily_kcal_target,
    daily_protein_target: proteinG,
    carbs_pct_target: profileForm.value.carbs_pct_target,
    fat_pct_target: profileForm.value.fat_pct_target,
    protein_pct_target: proteinPct,
    tolerance_percent: profileForm.value.tolerance_percent,
  };

  const request = profileForm.value.id
    ? supabase.from("person_profiles").update(payload).eq("id", profileForm.value.id)
    : supabase.from("person_profiles").insert(payload);

  const { error } = await request;
  profileSaving.value = false;

  if (error) {
    showStatus(`Error guardando perfil: ${error.message}`, "error");
    return;
  }

  resetProfileForm();
  await loadData();
  showStatus("Perfil guardado");
};

const saveProfileMacros = async () => {
  const currentUser = await loadCurrentUser();
  if (!currentUser || !profileForm.value.id || !profileMacroValidation.value.valid) return;

  profileSaving.value = true;
  const proteinPct = profileForm.value.protein_pct_target;
  const proteinG = Math.round((profileForm.value.daily_kcal_target * proteinPct) / 100 / 4 * 10) / 10;
  const { error } = await supabase
    .from("person_profiles")
    .update({
      daily_kcal_target: profileForm.value.daily_kcal_target,
      daily_protein_target: proteinG,
      carbs_pct_target: profileForm.value.carbs_pct_target,
      fat_pct_target: profileForm.value.fat_pct_target,
      protein_pct_target: proteinPct,
      tolerance_percent: profileForm.value.tolerance_percent,
    })
    .eq("id", profileForm.value.id);

  profileSaving.value = false;

  if (error) {
    showStatus(`Error guardando macros: ${error.message}`, "error");
    return;
  }

  await loadData();
  showStatus("Macros actualizados");
};

const editProfile = (profile: PersonProfile) => {
  profileForm.value = {
    id: profile.id,
    name: profile.name,
    sex: profile.sex,
    age: profile.age,
    daily_kcal_target: profile.daily_kcal_target,
    carbs_pct_target: profile.carbs_pct_target || 45,
    fat_pct_target: profile.fat_pct_target || 30,
    protein_pct_target: profile.protein_pct_target ?? (100 - (profile.carbs_pct_target || 0) - (profile.fat_pct_target || 0)),
    tolerance_percent: profile.tolerance_percent ?? 10,
  };
};

const deleteProfile = async (profileId: string) => {
  const confirmed = await confirmDialog({
    title: "Eliminar perfil",
    message: "¿Eliminar este perfil?",
    confirmText: "Eliminar",
    danger: true,
  });
  if (!confirmed) return;

  const { error } = await supabase
    .from("person_profiles")
    .delete()
    .eq("id", profileId);

  if (error) {
    showStatus(`Error eliminando perfil: ${error.message}`, "error");
    return;
  }

  await loadData();
  showStatus("Perfil eliminado");
};

const resetProfileForm = () => {
  profileForm.value = {
    id: "",
    name: "",
    sex: "other",
    age: 35,
    daily_kcal_target: 1900,
    carbs_pct_target: 45,
    fat_pct_target: 30,
    protein_pct_target: 25,
    tolerance_percent: 10,
  };
};

const sexLabel = (sex: PersonProfile["sex"]) => {
  if (sex === "female") return "Mujer";
  if (sex === "male") return "Hombre";
  return "Otro";
};

watch(
  () => [profileForm.value.carbs_pct_target, profileForm.value.fat_pct_target],
  () => {
    profileForm.value.protein_pct_target =
      100 - profileForm.value.carbs_pct_target - profileForm.value.fat_pct_target;
  },
);

onMounted(loadData);
</script>
