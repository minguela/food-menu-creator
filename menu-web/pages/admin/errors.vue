<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-[var(--text-1)]">Error Logs</h1>
        <p class="text-sm text-[var(--text-3)]">
          Registro centralizado de errores de web, Telegram y OCR.
        </p>
      </div>
      <button
        class="ui-btn-primary px-4 py-2"
        @click="loadLogs"
        :disabled="loading"
      >
        {{ loading ? "Cargando..." : "Actualizar" }}
      </button>
    </header>

    <div v-if="!isAuthorized" class="ui-surface p-5">
      <p class="text-sm ">
        Acceso restringido. Esta vista solo está disponible para el
        administrador.
      </p>
    </div>

    <div v-else-if="loading" class="text-center py-10">
      <div
        class="mx-auto h-10 w-10 animate-spin rounded-full border-b-2 border-[rgba(187,222,242,0.25)]"
      ></div>
      <p class="mt-3 text-sm text-[var(--text-3)]">Cargando registros...</p>
    </div>

    <div
      v-else-if="logs.length === 0"
      class="ui-surface p-5 text-sm text-[var(--text-3)]"
    >
      No hay errores registrados.
    </div>

    <section v-else class="space-y-3">
      <article v-for="item in logs" :key="item.id" class="ui-surface p-4">
        <div class="mb-2 flex flex-wrap items-center gap-2">
          <span class="ui-chip px-2 py-0.5 text-xs uppercase tracking-wide">{{
            item.source
          }}</span>
          <span class="text-xs text-[var(--text-3)]">{{
            formatDate(item.created_at)
          }}</span>
        </div>
        <p class="text-sm whitespace-pre-wrap">
          {{ item.message }}
        </p>
        <details v-if="item.stack_trace" class="mt-3 text-xs text-[var(--text-3)]">
          <summary class="cursor-pointer select-none">Ver stack trace</summary>
          <pre
            class="mt-2 overflow-x-auto rounded-xl border border-[var(--border-soft)] p-3"
            >{{ item.stack_trace }}</pre
          >
        </details>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { logError } from "~/utils/log-error";
import type { ErrorLog } from "~/types";

const supabase = useSupabase();
const config = useRuntimeConfig();
const { user, loadCurrentUser } = useCurrentUser();

const loading = ref(false);
const logs = ref<ErrorLog[]>([]);

const adminTelegramId = computed(() =>
  Number(config.public.adminTelegramId || 0),
);
const isAuthorized = computed(
  () =>
    !!user.value?.telegram_id &&
    !!adminTelegramId.value &&
    Number(user.value.telegram_id) === adminTelegramId.value,
);

const loadLogs = async () => {
  const currentUser = user.value || (await loadCurrentUser());
  if (!currentUser || !isAuthorized.value) {
    logs.value = [];
    return;
  }

  loading.value = true;
  const { data, error } = await supabase.rpc("list_error_logs", {
    p_telegram_id: currentUser.telegram_id,
    p_limit: 300,
  });

  if (error) {
    await logError("web", error, { context: "admin.errors.loadLogs" });
    logs.value = [];
  } else {
    logs.value = data || [];
  }
  loading.value = false;
};

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleString("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  });

onMounted(loadLogs);
</script>
