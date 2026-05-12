<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-[var(--text-1)]">Menús rotativos</h1>
        <p class="text-sm text-[var(--text-3)]">
          Estado de generación y acceso rápido a menús creados.
        </p>
      </div>
      <NuxtLink
        href="/generar"
        class="rounded-lg px-4 py-2 text-sm text-[var(--text-1)] hover:"
      >
        Nuevo menú rotativo
      </NuxtLink>
    </header>

    <section class="rounded-lg border bg-[var(--surface-1)] p-4">
      <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 class="font-semibold text-[var(--text-1)]">En creación</h2>
        <button
          class="rounded border px-3 py-1.5 text-xs text-[var(--text-2)] hover:bg-[rgba(255,255,255,0.06)] bg-[var(--surface-1)]"
          @click="cleanupFinishedJobs"
        >
          Limpiar completados/errores
        </button>
      </div>
      <div v-if="loadingJobs" class="text-sm text-[var(--text-3)]">Cargando jobs...</div>
      <div
        v-else-if="activeJobs.length === 0"
        class="rounded-lg border border-dashed p-4 text-sm text-[var(--text-3)]"
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
            <p class="font-medium text-[var(--text-1)]">
              {{ job.input_payload?.name || "Menú rotativo" }}
            </p>
            <div class="flex items-center gap-2">
              <span class="rounded-full px-2 py-1 text-xs" :class="statusClass(job.status)">
                {{ statusLabel(job.status) }}
              </span>
              <button
                v-if="job.result_menu_id"
                class="rounded border px-2 py-1 text-xs text-[var(--text-2)] hover:bg-[rgba(255,255,255,0.06)] bg-[var(--surface-1)]"
                @click="openRotatingMenu(job.result_menu_id)"
              >
                Abrir menú
              </button>
              <button
                class="rounded border px-2 py-1 text-xs text-[var(--text-2)] hover:bg-[rgba(255,255,255,0.06)] bg-[var(--surface-1)]"
                @click="toggleJobLogs(job)"
              >
                {{ expandedJobId === job.id ? "Ocultar logs" : "Ver logs" }}
              </button>
              <button
                class="rounded border border-[rgba(255,100,103,0.2)] px-2 py-1 text-xs text-[var(--danger)] hover:bg-[rgba(255,100,103,0.08)]"
                @click="deleteJob(job)"
              >
                Eliminar job
              </button>
            </div>
          </div>
          <p class="mt-1 text-xs text-[var(--text-3)]">
            {{ formatDateTime(job.created_at) }} · progreso {{ job.progress || 0 }}%
          </p>
          <p v-if="job.error_message" class="mt-1 text-xs text-[var(--danger)]">
            {{ job.error_message }}
          </p>
          <div
            v-if="job.status === 'failed' && failedRecipes(job).length > 0"
            class="mt-2 rounded border border-[rgba(255,100,103,0.2)] bg-[rgba(255,100,103,0.06)] p-2 text-xs "
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
          <div class="mt-2 h-2 w-full overflow-hidden rounded bg-[var(--surface-3)]">
            <div
              class="h-2 rounded transition-all"
              :style="{ width: `${Math.max(0, Math.min(100, job.progress || 0))}%` }"
            />
          </div>
          <div
            v-if="expandedJobId === job.id"
            class="mt-3 rounded-lg border bg-[var(--bg-shell)] p-3 text-xs text-[var(--text-1)]"
          >
            <div v-if="loadingLogs" class="">Cargando logs...</div>
            <div
              v-else-if="(logsByJob[job.id] || []).length === 0"
              class=""
            >
              Este job todavía no tiene logs persistidos.
            </div>
            <ol v-else class="max-h-72 space-y-2 overflow-y-auto">
              <li
                v-for="log in logsByJob[job.id]"
                :key="log.id"
                class="rounded border border-[var(--border-soft)] bg-[var(--surface-3)] p-2"
              >
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <span class="font-medium">{{ log.step }}</span>
                  <span class="">{{ formatDateTime(log.created_at) }}</span>
                </div>
                <p class="mt-1 text-[var(--text-2)]">{{ log.message }}</p>
                <details v-if="log.metadata" class="mt-2 text-[var(--text-3)]">
                  <summary class="cursor-pointer">metadata</summary>
                  <pre class="mt-2 overflow-x-auto rounded border border-[var(--border-soft)] p-2">{{ JSON.stringify(log.metadata, null, 2) }}</pre>
                </details>
              </li>
            </ol>
          </div>
        </article>
      </div>
    </section>

    <section class="rounded-lg border bg-[var(--surface-1)] p-4">
      <h2 class="mb-3 font-semibold text-[var(--text-1)]">Creados</h2>
      <div v-if="loadingMenus" class="text-sm text-[var(--text-3)]">Cargando menús...</div>
      <div
        v-else-if="rotatingMenus.length === 0"
        class="rounded-lg border border-dashed p-4 text-sm text-[var(--text-3)]"
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
              <p class="font-medium text-[var(--text-1)]">{{ menu.name }}</p>
              <p class="text-xs text-[var(--text-3)]">
                {{ menu.duration_days }} días · {{ formatDateTime(menu.created_at) }}
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                class="rounded border px-3 py-1.5 text-xs text-[var(--text-2)] hover:bg-[rgba(255,255,255,0.06)] bg-[var(--surface-1)]"
                @click="openRotatingMenu(menu.id)"
              >
                Abrir menú
              </button>
              <button
                class="rounded border px-3 py-1.5 text-xs text-[var(--text-2)] hover:bg-[rgba(255,255,255,0.06)] bg-[var(--surface-1)]"
                @click="openShoppingForMenu(menu.id)"
              >
                Ver compra asociada
              </button>
              <button
                class="rounded border border-[rgba(255,100,103,0.2)] px-3 py-1.5 text-xs text-[var(--danger)] hover:bg-[rgba(255,100,103,0.08)]"
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
const { confirm: confirmDialog } = useConfirmDialog();
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
  if (status === "completed") return " text-[var(--success)]";
  if (status === "failed") return "bg-[rgba(255,100,103,0.12)] ";
  return " text-[var(--goldenrod)]";
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
  const confirmed = await confirmDialog({
    title: "Eliminar job",
    message: "¿Eliminar este job?",
    confirmText: "Eliminar",
    danger: true,
  });
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
  const confirmed = await confirmDialog({
    title: "Limpiar panel",
    message: "¿Eliminar jobs completados y con error del panel de seguimiento?",
    confirmText: "Limpiar",
    danger: true,
  });
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
  const confirmed = await confirmDialog({
    title: "Eliminar menú rotativo",
    message: `¿Eliminar el menú rotativo "${menu.name}" y sus datos asociados?`,
    confirmText: "Eliminar",
    danger: true,
  });
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
