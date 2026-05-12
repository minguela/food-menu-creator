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
            <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">Perfiles con objetivos nutricionales por persona</p>
          </div>
        </div>
      </header>

      <!-- Profiles -->
      <section class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 class="text-lg font-bold text-slate-900 dark:text-slate-100">Personas</h2>
          </div>
          <button @click=" resetProfileForm "
            class="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors">
            Nuevo perfil
          </button>
        </div>

        <form class="grid gap-3 md:grid-cols-7 mb-6 items-end" @submit.prevent=" saveProfile ">
          <input v-model.trim=" profileForm.name " class="md:col-span-2 border rounded-lg px-3 py-2.5"
            placeholder="Nombre" required />
          <select v-model=" profileForm.sex " class="border rounded-lg px-3 py-2.5">
            <option value="female">Mujer</option>
            <option value="male">Hombre</option>
            <option value="other">Otro</option>
          </select>
          <input v-model.number=" profileForm.age " type="number" min="1" max="120" class="border rounded-lg px-3 py-2.5"
            placeholder="Edad" required />
          <input v-model.number=" profileForm.daily_kcal_target " type="number" min="800" max="6000" step="50"
            class="border rounded-lg px-3 py-2.5" placeholder="kcal" required />
          <input v-model.number=" profileForm.carbs_pct_target " type="number" min="5" max="80" step="1"
            class="border rounded-lg px-3 py-2.5" placeholder="HC %" required />
          <input v-model.number=" profileForm.fat_pct_target " type="number" min="5" max="70" step="1"
            class="border rounded-lg px-3 py-2.5" placeholder="Grasa %" required />
          <button type="submit" :disabled=" !profileFormValid || profileSaving "
            class="bg-gray-900 text-white rounded-lg px-3 py-2.5 disabled:opacity-50 font-medium">
            {{ profileForm.id ? "Actualizar" : "Añadir" }}
          </button>
        </form>

        <div v-if=" ( profileForm.carbs_pct_target || profileForm.fat_pct_target ) && profileForm.daily_kcal_target "
          class="mb-6 flex flex-wrap gap-4">
          <div class="rounded-xl border px-4 py-3 flex-1 min-w-[140px]"
            :class=" profileMacroValidation.valid ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50' ">
            <p class="text-xs text-slate-500">Proteína deducida</p>
            <p class="text-lg font-bold text-slate-900 dark:text-slate-100">
              {{ profileMacroValidation.proteinPct }}%
            </p>
          </div>
          <div v-if=" profileMacroValidation.valid " class="rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-800 px-4 py-3 flex-1 min-w-[140px]">
            <p class="text-xs text-slate-500">En gramos</p>
            <p class="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {{ profileMacroSummaryText }}
            </p>
          </div>
          <div v-if=" !profileMacroValidation.valid " class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex-1 min-w-[140px]">
            <p class="text-xs text-red-600">{{ profileMacroValidation.message }}</p>
          </div>
          <button type="button" v-if=" profileForm.id && profileMacroValidation.valid "
            class="rounded-lg border px-3 py-2.5 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50"
            :disabled=" profileSaving " @click=" saveProfileMacros ">
            Guardar macros
          </button>
        </div>

        <div v-if=" profiles.length === 0 " class="text-sm text-gray-500 dark:text-slate-400 border rounded-lg p-4">
          Añade al menos un perfil para adaptar objetivos por persona.
        </div>
        <div v-else class="divide-y border rounded-lg">
          <div v-for=" profile in profiles " :key=" profile.id "
            class="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p class="font-medium text-gray-900 dark:text-slate-100">{{ profile.name }}</p>
              <p class="text-sm text-gray-500 dark:text-slate-400">
                {{ sexLabel( profile.sex ) }} · {{ profile.age }} años ·
                {{ profile.daily_kcal_target }} kcal ·
                HC {{ profile.carbs_pct_target }}% G {{ profile.fat_pct_target }}% P {{ profile.protein_pct_target ?? ( 100 - ( profile.carbs_pct_target || 0 ) - ( profile.fat_pct_target || 0 ) ) }}%
              </p>
              <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">
                {{ profileGramSummary( profile ) }}
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

const profiles = ref<PersonProfile[]>( [] );
const profileSaving = ref( false );
const statusMessage = ref( "" );
const statusType = ref<"success" | "error">( "success" );

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

const profileForm = ref<ProfileForm>( {
  id: "",
  name: "",
  sex: "other",
  age: 35,
  daily_kcal_target: 1900,
  carbs_pct_target: 45,
  fat_pct_target: 30,
  protein_pct_target: 25,
  tolerance_percent: 10,
} );

const profileMacroValidation = computed( () =>
  validateMacroTargets( {
    fatPct: profileForm.value.fat_pct_target,
    carbsPct: profileForm.value.carbs_pct_target,
  } ),
);

const profileMacroSummaryText = computed( () => {
  if ( !profileForm.value.daily_kcal_target || !profileMacroValidation.value.valid ) return "";
  const targets = macroTargetsFromCalories( profileForm.value.daily_kcal_target, {
    fatPct: profileForm.value.fat_pct_target,
    carbsPct: profileForm.value.carbs_pct_target,
  } );
  return `${ targets.protein_g }g proteína · ${ targets.carbs_g }g hidratos · ${ targets.fat_g }g grasas`;
} );

const profileFormValid = computed(
  () =>
    Boolean( profileForm.value.name ) &&
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

const profileGramSummary = ( profile: PersonProfile ) => {
  const proteinPct = profile.protein_pct_target ?? ( 100 - ( profile.carbs_pct_target || 0 ) - ( profile.fat_pct_target || 0 ) );
  if ( proteinPct <= 0 ) return "";
  const proteinG = Math.round( ( profile.daily_kcal_target * proteinPct ) / 100 / 4 * 10 ) / 10;
  const carbsG = Math.round( ( profile.daily_kcal_target * ( profile.carbs_pct_target || 0 ) ) / 100 / 4 * 10 ) / 10;
  const fatG = Math.round( ( profile.daily_kcal_target * ( profile.fat_pct_target || 0 ) ) / 100 / 9 * 10 ) / 10;
  return `P ${ proteinG }g · HC ${ carbsG }g · G ${ fatG }g · tolerancia ${ profile.tolerance_percent ?? 10 }%`;
};

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

const saveProfile = async () => {
  const currentUser = await loadCurrentUser();
  if ( !currentUser || !profileFormValid.value ) return;

  profileSaving.value = true;
  const proteinPct = profileForm.value.protein_pct_target;
  const proteinG = Math.round( ( profileForm.value.daily_kcal_target * proteinPct ) / 100 / 4 * 10 ) / 10;
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

const saveProfileMacros = async () => {
  const currentUser = await loadCurrentUser();
  if ( !currentUser || !profileForm.value.id || !profileMacroValidation.value.valid ) return;

  profileSaving.value = true;
  const proteinPct = profileForm.value.protein_pct_target;
  const proteinG = Math.round( ( profileForm.value.daily_kcal_target * proteinPct ) / 100 / 4 * 10 ) / 10;
  const { error } = await supabase
    .from( "person_profiles" )
    .update( {
      daily_kcal_target: profileForm.value.daily_kcal_target,
      daily_protein_target: proteinG,
      carbs_pct_target: profileForm.value.carbs_pct_target,
      fat_pct_target: profileForm.value.fat_pct_target,
      protein_pct_target: proteinPct,
      tolerance_percent: profileForm.value.tolerance_percent,
    } )
    .eq( "id", profileForm.value.id );

  profileSaving.value = false;

  if ( error ) {
    showStatus( `Error guardando macros: ${ error.message }`, "error" );
    return;
  }

  await loadData();
  showStatus( "Macros actualizados" );
};

const editProfile = ( profile: PersonProfile ) => {
  profileForm.value = {
    id: profile.id,
    name: profile.name,
    sex: profile.sex,
    age: profile.age,
    daily_kcal_target: profile.daily_kcal_target,
    carbs_pct_target: profile.carbs_pct_target || 45,
    fat_pct_target: profile.fat_pct_target || 30,
    protein_pct_target: profile.protein_pct_target ?? ( 100 - ( profile.carbs_pct_target || 0 ) - ( profile.fat_pct_target || 0 ) ),
    tolerance_percent: profile.tolerance_percent ?? 10,
  };
};

const deleteProfile = async ( profileId: string ) => {
  const confirmed = await confirmDialog( {
    title: "Eliminar perfil",
    message: "¿Eliminar este perfil?",
    confirmText: "Eliminar",
    danger: true,
  } );
  if ( !confirmed ) return;

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
    daily_kcal_target: 1900,
    carbs_pct_target: 45,
    fat_pct_target: 30,
    protein_pct_target: 25,
    tolerance_percent: 10,
  };
};

const sexLabel = ( sex: PersonProfile[ "sex" ] ) => {
  if ( sex === "female" ) return "Mujer";
  if ( sex === "male" ) return "Hombre";
  return "Otro";
};

watch(
  () => [ profileForm.value.carbs_pct_target, profileForm.value.fat_pct_target ],
  () => {
    profileForm.value.protein_pct_target =
      100 - profileForm.value.carbs_pct_target - profileForm.value.fat_pct_target;
  },
);

onMounted( loadData );
</script>
