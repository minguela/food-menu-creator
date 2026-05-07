<template>
  <div class="min-h-screen bg-transparent">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <!-- Status Message -->
      <div v-if=" statusMessage " class="fixed right-4 top-4 z-50 px-4 py-2 rounded-xl shadow-lg"
        :class=" statusType === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200' ">
        <span class="text-sm font-medium">{{ statusMessage }}</span>
      </div>

      <!-- Header -->
      <header class="mb-8">
        <div class="flex items-center gap-4">
          <div
            class="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-lg shadow-slate-200">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M10.325 4.317c.83-1.14 2.423-1.14 3.253 0 .83 1.14.83 2.99 0 4.13-.83 1.14-2.423 1.14-3.253 0-.83-1.14-.83-2.99 0-4.13zM12 12h.01M19 12h.01M6 12h.01M12 19h.01M12 6h.01" />
            </svg>
          </div>
          <div>
            <h1 class="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Configuración
            </h1>
            <p class="text-slate-500 text-sm mt-1">Personaliza tus objetivos nutricionales</p>
          </div>
        </div>
      </header>

      <div class="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <!-- Global Objectives -->
        <section class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 class="text-lg font-bold text-slate-900">Objetivos globales</h2>
          </div>

          <div class="space-y-5">
            <label class="block">
              <span class="block text-sm font-semibold text-slate-700 mb-2">Calorías diarias</span>
              <input v-model.number=" config.daily_kcal_target " type="number" min="1000" max="5000" step="50"
                class="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
            </label>

            <label class="block">
              <span class="block text-sm font-semibold text-slate-700 mb-2">Proteína objetivo (g/día)</span>
              <input v-model.number=" config.daily_protein_target " type="number" min="20" max="400" step="1"
                class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </label>

            <label class="block">
              <span class="block text-sm font-medium text-gray-700 mb-1">Personas para cantidades</span>
              <input v-model.number=" config.persons_count " type="number" min="1" max="10"
                class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </label>

            <div class="grid grid-cols-2 gap-3">
              <label class="block">
                <span class="block text-sm font-medium text-gray-700 mb-1">Grasas objetivo (%)</span>
                <input v-model.number=" config.fat_pct_target " type="number" min="10" max="70"
                  class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
              </label>
              <label class="block">
                <span class="block text-sm font-medium text-gray-700 mb-1">Hidratos objetivo (%)</span>
                <input v-model.number=" config.carbs_pct_target " type="number" min="10" max="80"
                  class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
              </label>
            </div>

            <div class="rounded-lg border p-4" :class=" macroValidation.valid
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
              ">
              <div class="flex justify-between text-sm">
                <span class="text-gray-700">Proteína deducida</span>
                <span class="font-semibold">{{ macroValidation.proteinPct }}%</span>
              </div>
              <p class="text-xs mt-2" :class=" macroValidation.valid ? 'text-green-700' : 'text-red-700' ">
                {{
                  macroValidation.valid
                    ? macroSummaryText
                    : macroValidation.message
                }}
              </p>
            </div>

            <button @click=" saveConfig " :disabled=" saving || !isDirty || !macroValidation.valid "
              class="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium">
              {{ saving ? "Guardando..." : "Guardar objetivos" }}
            </button>
          </div>
        </section>

        <!-- Personas -->
        <section class="bg-white rounded-lg shadow-sm border p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold">Personas</h2>
            <button @click=" resetProfileForm "
              class="px-3 py-2 text-sm text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100">
              Nuevo perfil
            </button>
          </div>

          <form class="grid gap-3 md:grid-cols-6 mb-5" @submit.prevent=" saveProfile ">
            <input v-model.trim=" profileForm.name " class="md:col-span-2 border rounded-lg px-3 py-2"
              placeholder="Nombre" required />
            <select v-model=" profileForm.sex " class="border rounded-lg px-3 py-2">
              <option value="female">Mujer</option>
              <option value="male">Hombre</option>
              <option value="other">Otro</option>
            </select>
            <input v-model.number=" profileForm.age " type="number" min="1" max="120" class="border rounded-lg px-3 py-2"
              placeholder="Edad" required />
            <input v-model.number=" profileForm.daily_kcal_target " type="number" min="800" max="6000" step="50"
              class="border rounded-lg px-3 py-2" placeholder="kcal" required />
            <input v-model.number=" profileForm.daily_protein_target " type="number" min="20" max="400" step="1"
              class="border rounded-lg px-3 py-2" placeholder="proteína g" required />
            <button type="submit" :disabled=" !profileFormValid || profileSaving "
              class="bg-gray-900 text-white rounded-lg px-3 py-2 disabled:opacity-50">
              {{ profileForm.id ? "Actualizar" : "Añadir" }}
            </button>
          </form>

          <div v-if=" profiles.length === 0 " class="text-sm text-gray-500 border rounded-lg p-4">
            Añade al menos un perfil para adaptar objetivos por persona.
          </div>
          <div v-else class="divide-y border rounded-lg">
            <div v-for=" profile in profiles " :key=" profile.id "
              class="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p class="font-medium text-gray-900">{{ profile.name }}</p>
                <p class="text-sm text-gray-500">
                  {{ sexLabel( profile.sex ) }} · {{ profile.age }} años ·
                  {{ profile.daily_kcal_target }} kcal ·
                  {{ profile.daily_protein_target }}g proteína
                </p>
              </div>
              <div class="flex gap-2">
                <button @click="editProfile( profile )"
                  class="px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded">
                  Editar
                </button>
                <button @click="deleteProfile( profile.id )"
                  class="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded">
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
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

const config = ref( {
  daily_kcal_target: 1900,
  daily_protein_target: 120,
  persons_count: 2,
  fat_pct_target: 30,
  carbs_pct_target: 45,
} );

const profiles = ref<PersonProfile[]>( [] );
const saving = ref( false );
const profileSaving = ref( false );
const statusMessage = ref( "" );
const statusType = ref<"success" | "error">( "success" );

const profileForm = ref( {
  id: "",
  name: "",
  sex: "other" as PersonProfile[ "sex" ],
  age: 35,
  daily_kcal_target: 1900,
  daily_protein_target: 120,
} );

const macroValidation = computed( () =>
  validateMacroTargets( {
    fatPct: config.value.fat_pct_target,
    carbsPct: config.value.carbs_pct_target,
  } ),
);

const macroSummaryText = computed( () => {
  const targets = macroTargetsFromCalories( config.value.daily_kcal_target, {
    fatPct: config.value.fat_pct_target,
    carbsPct: config.value.carbs_pct_target,
  } );
  return `${ targets.protein_g }g proteína · ${ targets.carbs_g }g hidratos · ${ targets.fat_g }g grasas`;
} );

const isDirty = computed( () => {
  if ( !user.value ) return false;
  return (
    config.value.daily_kcal_target !== user.value.daily_kcal_target ||
    config.value.daily_protein_target !== user.value.daily_protein_target ||
    config.value.persons_count !== user.value.persons_count ||
    config.value.fat_pct_target !== ( user.value.fat_pct_target || 30 ) ||
    config.value.carbs_pct_target !== ( user.value.carbs_pct_target || 45 )
  );
} );

const profileFormValid = computed(
  () =>
    Boolean( profileForm.value.name ) &&
    profileForm.value.age >= 1 &&
    profileForm.value.age <= 120 &&
    profileForm.value.daily_kcal_target >= 800 &&
    profileForm.value.daily_kcal_target <= 6000 &&
    profileForm.value.daily_protein_target >= 20 &&
    profileForm.value.daily_protein_target <= 400,
);

const showStatus = ( message: string, type: "success" | "error" = "success" ) => {
  statusMessage.value = message;
  statusType.value = type;
  setTimeout( () => {
    statusMessage.value = "";
  }, 3000 );
};

const loadData = async () => {
  const currentUser = await loadCurrentUser();
  if ( !currentUser ) {
    showStatus(
      "No hay usuario configurado. Usa /start en Telegram primero.",
      "error",
    );
    return;
  }

  config.value = {
    daily_kcal_target: currentUser.daily_kcal_target || 1900,
    daily_protein_target: currentUser.daily_protein_target || 120,
    persons_count: currentUser.persons_count || 2,
    fat_pct_target: currentUser.fat_pct_target || 30,
    carbs_pct_target: currentUser.carbs_pct_target || 45,
  };

  const { data, error } = await supabase
    .from( "person_profiles" )
    .select( "*" )
    .eq( "user_id", currentUser.id )
    .order( "created_at", { ascending: true } );

  if ( error ) {
    showStatus( `Error cargando perfiles: ${ error.message }`, "error" );
    return;
  }

  profiles.value = data || [];
};

const saveConfig = async () => {
  const currentUser = await loadCurrentUser();
  if ( !currentUser || !macroValidation.value.valid ) return;

  saving.value = true;
  const { error } = await supabase
    .from( "users" )
    .update( {
      daily_kcal_target: config.value.daily_kcal_target,
      daily_protein_target: config.value.daily_protein_target,
      persons_count: config.value.persons_count,
      fat_pct_target: config.value.fat_pct_target,
      carbs_pct_target: config.value.carbs_pct_target,
      updated_at: new Date().toISOString(),
    } )
    .eq( "id", currentUser.id );

  saving.value = false;

  if ( error ) {
    showStatus( `Error guardando objetivos: ${ error.message }`, "error" );
    return;
  }

  user.value = {
    ...currentUser,
    daily_kcal_target: config.value.daily_kcal_target,
    daily_protein_target: config.value.daily_protein_target,
    persons_count: config.value.persons_count,
    fat_pct_target: config.value.fat_pct_target,
    carbs_pct_target: config.value.carbs_pct_target,
  };
  showStatus( "Objetivos guardados" );
};

const saveProfile = async () => {
  const currentUser = await loadCurrentUser();
  if ( !currentUser || !profileFormValid.value ) return;

  profileSaving.value = true;
  const payload = {
    user_id: currentUser.id,
    name: profileForm.value.name,
    sex: profileForm.value.sex,
    age: profileForm.value.age,
    daily_kcal_target: profileForm.value.daily_kcal_target,
    daily_protein_target: profileForm.value.daily_protein_target,
    fat_pct_target: config.value.fat_pct_target,
    carbs_pct_target: config.value.carbs_pct_target,
  };

  const request = profileForm.value.id
    ? supabase
      .from( "person_profiles" )
      .update( payload )
      .eq( "id", profileForm.value.id )
    : supabase.from( "person_profiles" ).insert( payload );

  const { error } = await request;
  profileSaving.value = false;

  if ( error ) {
    showStatus( `Error guardando perfil: ${ error.message }`, "error" );
    return;
  }

  resetProfileForm();
  await loadData();
  showStatus( "Perfil guardado" );
};

const editProfile = ( profile: PersonProfile ) => {
  profileForm.value = {
    id: profile.id,
    name: profile.name,
    sex: profile.sex,
    age: profile.age,
    daily_kcal_target: profile.daily_kcal_target,
    daily_protein_target: profile.daily_protein_target || 120,
  };
};

const deleteProfile = async ( profileId: string ) => {
  if ( !confirm( "¿Eliminar este perfil?" ) ) return;

  const { error } = await supabase
    .from( "person_profiles" )
    .delete()
    .eq( "id", profileId );

  if ( error ) {
    showStatus( `Error eliminando perfil: ${ error.message }`, "error" );
    return;
  }

  await loadData();
  showStatus( "Perfil eliminado" );
};

const resetProfileForm = () => {
  profileForm.value = {
    id: "",
    name: "",
    sex: "other",
    age: 35,
    daily_kcal_target: config.value.daily_kcal_target,
    daily_protein_target: config.value.daily_protein_target,
  };
};

const sexLabel = ( sex: PersonProfile[ "sex" ] ) => {
  if ( sex === "female" ) return "Mujer";
  if ( sex === "male" ) return "Hombre";
  return "Otro";
};

onMounted( loadData );
</script>
