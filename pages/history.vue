<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Menús rotativos</h1>
        <p class="text-sm text-gray-500">
          Estado de generación y acceso rápido a menús creados.
        </p>
      </div>
      <NuxtLink
        href="/generar"
        class="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
      >
        Nuevo menú rotativo
      </NuxtLink>
    </header>

    <section class="rounded-lg border bg-white p-4">
      <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 class="font-semibold text-gray-900">En creación</h2>
        <button
          class="rounded border px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
          @click="cleanupFinishedJobs"
        >
          Limpiar completados/errores
        </button>
      </div>
      <div v-if="loadingJobs" class="text-sm text-gray-500">Cargando jobs...</div>
      <div
        v-else-if="activeJobs.length === 0"
        class="rounded-lg border border-dashed p-4 text-sm text-gray-500"
      >
        No hay menús en proceso ahora mismo.
      </div>
      <div v-else class="space-y-3">
        <article
          v-for="job in activeJobs"
          :key="job.id"
          class="rounded-lg border p-3"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <p class="font-medium text-gray-900">
              {{ job.input_payload?.name || "Menú rotativo" }}
            </p>
            <div class="flex items-center gap-2">
              <span class="rounded-full px-2 py-1 text-xs" :class="statusClass(job.status)">
                {{ statusLabel(job.status) }}
              </span>
              <button
                v-if="job.result_menu_id"
                class="rounded border px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                @click="openRotatingMenu(job.result_menu_id)"
              >
                Abrir menú
              </button>
              <button
                class="rounded border px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                @click="toggleJobLogs(job)"
              >
                {{ expandedJobId === job.id ? "Ocultar logs" : "Ver logs" }}
              </button>
              <button
                class="rounded border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                @click="deleteJob(job)"
              >
                Eliminar job
              </button>
            </div>
          </div>
          <p class="mt-1 text-xs text-gray-500">
            {{ formatDateTime(job.created_at) }} · progreso {{ job.progress || 0 }}%
          </p>
          <p v-if="job.error_message" class="mt-1 text-xs text-red-600">
            {{ job.error_message }}
          </p>
          <div
            v-if="job.status === 'failed' && failedRecipes(job).length > 0"
            class="mt-2 rounded border border-red-200 bg-red-50 p-2 text-xs text-red-800"
          >
            <p class="font-medium">Recetas bloqueando la generación:</p>
            <ul class="mt-1 space-y-1">
              <li
                v-for="recipe in failedRecipes(job)"
                :key="`${job.id}-${recipe.dish_id}-${recipe.reason}`"
              >
                {{ recipe.dish_name }} ({{ recipe.reason }})
              </li>
            </ul>
            <div class="mt-2 flex gap-2">
              <NuxtLink href="/recipes" class="underline">Ir a Recetas</NuxtLink>
              <NuxtLink href="/ingredients" class="underline">Ir a Ingredientes</NuxtLink>
              <NuxtLink href="/generar" class="underline">Volver a generar</NuxtLink>
            </div>
          </div>
          <div class="mt-2 h-2 w-full overflow-hidden rounded bg-gray-100">
            <div
              class="h-2 rounded bg-indigo-600 transition-all"
              :style="{ width: `${Math.max(0, Math.min(100, job.progress || 0))}%` }"
            />
          </div>
          <div
            v-if="expandedJobId === job.id"
            class="mt-3 rounded-lg border bg-zinc-950 p-3 text-xs text-zinc-100"
          >
            <div v-if="loadingLogs" class="text-zinc-400">Cargando logs...</div>
            <div
              v-else-if="(logsByJob[job.id] || []).length === 0"
              class="text-zinc-400"
            >
              Este job todavía no tiene logs persistidos.
            </div>
            <ol v-else class="max-h-72 space-y-2 overflow-y-auto">
              <li
                v-for="log in logsByJob[job.id]"
                :key="log.id"
                class="rounded border border-zinc-800 bg-zinc-900 p-2"
              >
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <span class="font-medium">{{ log.step }}</span>
                  <span class="text-zinc-500">{{ formatDateTime(log.created_at) }}</span>
                </div>
                <p class="mt-1 text-zinc-300">{{ log.message }}</p>
                <details v-if="log.metadata" class="mt-2 text-zinc-400">
                  <summary class="cursor-pointer">metadata</summary>
                  <pre class="mt-2 overflow-x-auto rounded border border-zinc-800 p-2">{{ JSON.stringify(log.metadata, null, 2) }}</pre>
                </details>
              </li>
            </ol>
          </div>
        </article>
      </div>
    </section>

    <section class="rounded-lg border bg-white p-4">
      <h2 class="mb-3 font-semibold text-gray-900">Creados</h2>
      <div v-if="loadingMenus" class="text-sm text-gray-500">Cargando menús...</div>
      <div
        v-else-if="rotatingMenus.length === 0"
        class="rounded-lg border border-dashed p-4 text-sm text-gray-500"
      >
        Todavía no tienes menús rotativos creados.
      </div>
      <div v-else class="space-y-3">
        <article
          v-for="menu in rotatingMenus"
          :key="menu.id"
          class="rounded-lg border p-3"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p class="font-medium text-gray-900">{{ menu.name }}</p>
              <p class="text-xs text-gray-500">
                {{ menu.duration_days }} días · {{ formatDateTime(menu.created_at) }}
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                class="rounded border px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                @click="openRotatingMenu(menu.id)"
              >
                Abrir menú
              </button>
              <button
                class="rounded border px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                @click="openShoppingForMenu(menu.id)"
              >
                Ver compra asociada
              </button>
              <button
                class="rounded border border-red-200 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50"
                @click="deleteRotatingMenu(menu)"
              >
                Eliminar
              </button>
            </div>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { logError } from "~/utils/log-error";
import type { RotatingMenu } from "~/types";

type MenuGenerationJob = {
  id: string;
  user_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  error_message?: string | null;
  input_payload?: Record<string, any> | null;
  result_payload?: Record<string, any> | null;
  result_menu_id?: string | null;
  created_at: string;
};

type MenuGenerationLog = {
  id: string;
  job_id: string;
  level: "debug" | "info" | "warn" | "error";
  step: string;
  message: string;
  metadata?: Record<string, any> | null;
  created_at: string;
};

const supabase = useSupabase();
const { loadCurrentUser } = useCurrentUser();
const appToast = useAppToast();
const router = useRouter();

const loadingJobs = ref(true);
const loadingMenus = ref(true);
const activeJobs = ref<MenuGenerationJob[]>([]);
const rotatingMenus = ref<RotatingMenu[]>([]);
const jobsChannel = ref<any>(null);
const expandedJobId = ref<string | null>(null);
const loadingLogs = ref(false);
const logsByJob = ref<Record<string, MenuGenerationLog[]>>({});

const statusLabel = (status: MenuGenerationJob["status"]) => {
  if (status === "pending") return "Pendiente";
  if (status === "processing") return "Procesando";
  if (status === "completed") return "Completado";
  return "Error";
};

const statusClass = (status: MenuGenerationJob["status"]) => {
  if (status === "completed") return "bg-emerald-100 text-emerald-800";
  if (status === "failed") return "bg-red-100 text-red-800";
  return "bg-amber-100 text-amber-800";
};

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const loadData = async () => {
  loadingJobs.value = true;
  loadingMenus.value = true;
  try {
    const currentUser = await loadCurrentUser();
    if (!currentUser) {
      activeJobs.value = [];
      rotatingMenus.value = [];
      return;
    }

    const [{ data: jobs }, { data: menus }] = await Promise.all([
      supabase
        .from("menu_generation_jobs")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("rotating_menus")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    activeJobs.value = ((jobs || []) as MenuGenerationJob[]).filter((job) =>
      ["pending", "processing", "failed"].includes(job.status),
    );
    rotatingMenus.value = (menus || []) as RotatingMenu[];
    subscribeRealtime(currentUser.id);
  } catch (error) {
    await logError("web", error, { context: "history.loadData" });
  } finally {
    loadingJobs.value = false;
    loadingMenus.value = false;
  }
};

const subscribeRealtime = (userId: string) => {
  if (jobsChannel.value) supabase.removeChannel(jobsChannel.value);

  jobsChannel.value = supabase
    .channel(`menu-generation-jobs-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "menu_generation_jobs",
        filter: `user_id=eq.${userId}`,
      },
      async () => {
        await loadData();
      },
    )
    .subscribe();
};

const openShoppingForMenu = async (rotatingMenuId: string) => {
  try {
    const currentUser = await loadCurrentUser();
    if (!currentUser) return;
    await $fetch("/api/shopping-from-rotating", {
      method: "POST",
      body: { userId: currentUser.id, rotatingMenuId },
    });
    await router.push("/shopping");
  } catch (error) {
    await logError("web", error, { context: "history.openShoppingForMenu" });
  }
};

const openRotatingMenu = async (rotatingMenuId: string) => {
  await router.push(`/rotating/${rotatingMenuId}`);
};

const failedRecipes = (job: MenuGenerationJob) =>
  (job.result_payload?.error_data?.uncured_recipes ||
    job.result_payload?.error_data?.data?.uncured_recipes ||
    []) as Array<{
    dish_id: string;
    dish_name: string;
    reason: string;
  }>;

const toggleJobLogs = async (job: MenuGenerationJob) => {
  if (expandedJobId.value === job.id) {
    expandedJobId.value = null;
    return;
  }
  expandedJobId.value = job.id;
  if (logsByJob.value[job.id]) return;
  loadingLogs.value = true;
  try {
    const { data, error } = await supabase
      .from("menu_generation_logs")
      .select("*")
      .eq("job_id", job.id)
      .order("created_at", { ascending: true })
      .limit(300);
    if (error) throw error;
    logsByJob.value = {
      ...logsByJob.value,
      [job.id]: (data || []) as MenuGenerationLog[],
    };
  } catch (error) {
    await logError("web", error, { context: "history.toggleJobLogs" });
    logsByJob.value = { ...logsByJob.value, [job.id]: [] };
  } finally {
    loadingLogs.value = false;
  }
};

const deleteJob = async (job: MenuGenerationJob) => {
  const confirmed = confirm("¿Eliminar este job?");
  if (!confirmed) return;
  try {
    const currentUser = await loadCurrentUser();
    if (!currentUser) return;
    await $fetch("/api/rotating-menu-jobs-delete", {
      method: "POST",
      body: { userId: currentUser.id, jobId: job.id },
    });
    await loadData();
  } catch (error) {
    await logError("web", error, { context: "history.deleteJob" });
    appToast.fromError("No se pudo eliminar el job.", error);
  }
};

const cleanupFinishedJobs = async () => {
  const confirmed = confirm(
    "¿Eliminar jobs completados y con error del panel de seguimiento?",
  );
  if (!confirmed) return;
  try {
    const currentUser = await loadCurrentUser();
    if (!currentUser) return;
    await $fetch("/api/rotating-menu-jobs-cleanup", {
      method: "POST",
      body: { userId: currentUser.id },
    });
    await loadData();
  } catch (error) {
    await logError("web", error, { context: "history.cleanupFinishedJobs" });
    appToast.fromError("No se pudieron limpiar los jobs.", error);
  }
};

const deleteRotatingMenu = async (menu: RotatingMenu) => {
  const confirmed = confirm(
    `¿Eliminar el menú rotativo "${menu.name}" y sus datos asociados?`,
  );
  if (!confirmed) return;
  try {
    const currentUser = await loadCurrentUser();
    if (!currentUser) return;
    const { error } = await supabase
      .from("rotating_menus")
      .delete()
      .eq("id", menu.id)
      .eq("user_id", currentUser.id);
    if (error) throw error;
    await loadData();
  } catch (error) {
    await logError("web", error, { context: "history.deleteRotatingMenu" });
    appToast.fromError("No se pudo eliminar el menú rotativo.", error);
  }
};

onMounted(loadData);
onUnmounted(() => {
  if (jobsChannel.value) {
    supabase.removeChannel(jobsChannel.value);
    jobsChannel.value = null;
  }
});
</script>
