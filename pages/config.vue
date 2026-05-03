<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Configuración</h1>
      <p
        v-if="statusMessage"
        class="text-sm"
        :class="statusType === 'error' ? 'text-red-600' : 'text-green-600'"
      >
        {{ statusMessage }}
      </p>
    </div>

    <div class="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <section class="bg-white rounded-lg shadow-sm border p-6">
        <h2 class="text-lg font-semibold mb-4">Objetivos globales</h2>

        <div class="space-y-4">
          <label class="block">
            <span class="block text-sm font-medium text-gray-700 mb-1"
              >Calorías diarias</span
            >
            <input
              v-model.number="config.daily_kcal_target"
              type="number"
              min="1000"
              max="5000"
              step="50"
              class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </label>

          <label class="block">
            <span class="block text-sm font-medium text-gray-700 mb-1"
              >Personas para cantidades</span
            >
            <input
              v-model.number="config.persons_count"
              type="number"
              min="1"
              max="10"
              class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </label>

          <div class="grid grid-cols-2 gap-3">
            <label class="block">
              <span class="block text-sm font-medium text-gray-700 mb-1"
                >Grasas objetivo (%)</span
              >
              <input
                v-model.number="config.fat_pct_target"
                type="number"
                min="10"
                max="70"
                class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </label>
            <label class="block">
              <span class="block text-sm font-medium text-gray-700 mb-1"
                >Hidratos objetivo (%)</span
              >
              <input
                v-model.number="config.carbs_pct_target"
                type="number"
                min="10"
                max="80"
                class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </label>
          </div>

          <div
            class="rounded-lg border p-4"
            :class="
              macroValidation.valid
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            "
          >
            <div class="flex justify-between text-sm">
              <span class="text-gray-700">Proteína deducida</span>
              <span class="font-semibold"
                >{{ macroValidation.proteinPct }}%</span
              >
            </div>
            <p
              class="text-xs mt-2"
              :class="macroValidation.valid ? 'text-green-700' : 'text-red-700'"
            >
              {{
                macroValidation.valid
                  ? macroSummaryText
                  : macroValidation.message
              }}
            </p>
          </div>

          <button
            @click="saveConfig"
            :disabled="saving || !isDirty || !macroValidation.valid"
            class="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {{ saving ? "Guardando..." : "Guardar objetivos" }}
          </button>
        </div>
      </section>

      <section class="bg-white rounded-lg shadow-sm border p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">Personas</h2>
          <button
            @click="resetProfileForm"
            class="px-3 py-2 text-sm text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"
          >
            Nuevo perfil
          </button>
        </div>

        <form
          class="grid gap-3 md:grid-cols-6 mb-5"
          @submit.prevent="saveProfile"
        >
          <input
            v-model.trim="profileForm.name"
            class="md:col-span-2 border rounded-lg px-3 py-2"
            placeholder="Nombre"
            required
          />
          <select v-model="profileForm.sex" class="border rounded-lg px-3 py-2">
            <option value="female">Mujer</option>
            <option value="male">Hombre</option>
            <option value="other">Otro</option>
          </select>
          <input
            v-model.number="profileForm.age"
            type="number"
            min="1"
            max="120"
            class="border rounded-lg px-3 py-2"
            placeholder="Edad"
            required
          />
          <input
            v-model.number="profileForm.daily_kcal_target"
            type="number"
            min="800"
            max="6000"
            step="50"
            class="border rounded-lg px-3 py-2"
            placeholder="kcal"
            required
          />
          <button
            type="submit"
            :disabled="!profileFormValid || profileSaving"
            class="bg-gray-900 text-white rounded-lg px-3 py-2 disabled:opacity-50"
          >
            {{ profileForm.id ? "Actualizar" : "Añadir" }}
          </button>
        </form>

        <div
          v-if="profiles.length === 0"
          class="text-sm text-gray-500 border rounded-lg p-4"
        >
          Añade al menos un perfil para adaptar objetivos por persona.
        </div>
        <div v-else class="divide-y border rounded-lg">
          <div
            v-for="profile in profiles"
            :key="profile.id"
            class="flex flex-wrap items-center justify-between gap-3 p-4"
          >
            <div>
              <p class="font-medium text-gray-900">{{ profile.name }}</p>
              <p class="text-sm text-gray-500">
                {{ sexLabel(profile.sex) }} · {{ profile.age }} años ·
                {{ profile.daily_kcal_target }} kcal
              </p>
            </div>
            <div class="flex gap-2">
              <button
                @click="editProfile(profile)"
                class="px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded"
              >
                Editar
              </button>
              <button
                @click="deleteProfile(profile.id)"
                class="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded"
              >
                Eliminar
              </button>
            </div>
          </div>
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

const config = ref({
  daily_kcal_target: 1900,
  persons_count: 2,
  fat_pct_target: 30,
  carbs_pct_target: 45,
});

const profiles = ref<PersonProfile[]>([]);
const saving = ref(false);
const profileSaving = ref(false);
const statusMessage = ref("");
const statusType = ref<"success" | "error">("success");

const profileForm = ref({
  id: "",
  name: "",
  sex: "other" as PersonProfile["sex"],
  age: 35,
  daily_kcal_target: 1900,
});

const macroValidation = computed(() =>
  validateMacroTargets({
    fatPct: config.value.fat_pct_target,
    carbsPct: config.value.carbs_pct_target,
  }),
);

const macroSummaryText = computed(() => {
  const targets = macroTargetsFromCalories(config.value.daily_kcal_target, {
    fatPct: config.value.fat_pct_target,
    carbsPct: config.value.carbs_pct_target,
  });
  return `${targets.protein_g}g proteína · ${targets.carbs_g}g hidratos · ${targets.fat_g}g grasas`;
});

const isDirty = computed(() => {
  if (!user.value) return false;
  return (
    config.value.daily_kcal_target !== user.value.daily_kcal_target ||
    config.value.persons_count !== user.value.persons_count ||
    config.value.fat_pct_target !== (user.value.fat_pct_target || 30) ||
    config.value.carbs_pct_target !== (user.value.carbs_pct_target || 45)
  );
});

const profileFormValid = computed(
  () =>
    Boolean(profileForm.value.name) &&
    profileForm.value.age >= 1 &&
    profileForm.value.age <= 120 &&
    profileForm.value.daily_kcal_target >= 800 &&
    profileForm.value.daily_kcal_target <= 6000,
);

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
    showStatus(
      "No hay usuario configurado. Usa /start en Telegram primero.",
      "error",
    );
    return;
  }

  config.value = {
    daily_kcal_target: currentUser.daily_kcal_target || 1900,
    persons_count: currentUser.persons_count || 2,
    fat_pct_target: currentUser.fat_pct_target || 30,
    carbs_pct_target: currentUser.carbs_pct_target || 45,
  };

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

const saveConfig = async () => {
  const currentUser = await loadCurrentUser();
  if (!currentUser || !macroValidation.value.valid) return;

  saving.value = true;
  const proteinTarget = macroTargetsFromCalories(
    config.value.daily_kcal_target,
    {
      fatPct: config.value.fat_pct_target,
      carbsPct: config.value.carbs_pct_target,
    },
  ).protein_g;

  const { error } = await supabase
    .from("users")
    .update({
      daily_kcal_target: config.value.daily_kcal_target,
      daily_protein_target: proteinTarget,
      persons_count: config.value.persons_count,
      fat_pct_target: config.value.fat_pct_target,
      carbs_pct_target: config.value.carbs_pct_target,
      updated_at: new Date().toISOString(),
    })
    .eq("id", currentUser.id);

  saving.value = false;

  if (error) {
    showStatus(`Error guardando objetivos: ${error.message}`, "error");
    return;
  }

  user.value = {
    ...currentUser,
    daily_kcal_target: config.value.daily_kcal_target,
    daily_protein_target: proteinTarget,
    persons_count: config.value.persons_count,
    fat_pct_target: config.value.fat_pct_target,
    carbs_pct_target: config.value.carbs_pct_target,
  };
  showStatus("Objetivos guardados");
};

const saveProfile = async () => {
  const currentUser = await loadCurrentUser();
  if (!currentUser || !profileFormValid.value) return;

  profileSaving.value = true;
  const payload = {
    user_id: currentUser.id,
    name: profileForm.value.name,
    sex: profileForm.value.sex,
    age: profileForm.value.age,
    daily_kcal_target: profileForm.value.daily_kcal_target,
    fat_pct_target: config.value.fat_pct_target,
    carbs_pct_target: config.value.carbs_pct_target,
  };

  const request = profileForm.value.id
    ? supabase
        .from("person_profiles")
        .update(payload)
        .eq("id", profileForm.value.id)
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

const editProfile = (profile: PersonProfile) => {
  profileForm.value = {
    id: profile.id,
    name: profile.name,
    sex: profile.sex,
    age: profile.age,
    daily_kcal_target: profile.daily_kcal_target,
  };
};

const deleteProfile = async (profileId: string) => {
  if (!confirm("¿Eliminar este perfil?")) return;

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
    daily_kcal_target: config.value.daily_kcal_target,
  };
};

const sexLabel = (sex: PersonProfile["sex"]) => {
  if (sex === "female") return "Mujer";
  if (sex === "male") return "Hombre";
  return "Otro";
};

onMounted(loadData);
</script>
