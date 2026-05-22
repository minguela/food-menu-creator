<template>
  <div class="dark min-h-screen overflow-x-hidden bg-[var(--color-deep-space)] text-[var(--color-text-1)]">
    <header class="sticky top-0 z-40 border-b ui-divider bg-[var(--bg-shell)]/95 backdrop-blur-xl">
      <div
        class="mx-auto flex h-16 w-full max-w-7xl items-center px-4 sm:px-6 lg:px-8"
      >
        <NuxtLink
          href="/"
          class="ui-title text-xl tracking-[-0.01em] text-white"
        >
          MenuPlanner
        </NuxtLink>
        <nav
          aria-label="Navegación principal"
          class="ml-auto hidden items-center gap-2 md:flex"
        >
          <NuxtLink
            v-for="item in navItems"
            :key="item.path"
            :href="item.path"
            class="rounded-2xl px-4 py-2 text-sm font-medium"
            :class="$route.path === item.path ? 'ui-chip'
                : 'ui-muted hover:bg-[var(--color-surface-3)] hover:text-white'
             "
          >
            {{ item.label }}
          </NuxtLink>
        </nav>
        <div class="ml-3 hidden text-right text-[11px] ui-subtle lg:block">
          <p>v{{ appVersion }}</p>
          <p v-if="appCommitShort">{{ appCommitShort }}</p>
        </div>
      </div>
    </header>

    <main
      class="mx-auto w-full max-w-7xl px-4 pb-24 pt-8 sm:px-6 lg:px-8 lg:pb-8 bg-[var(--color-deep-space)]"
    >
      <NuxtPage />
    </main>

    <Toaster rich-colors position="top-right" :expand="true" />
    <AppConfirmDialog />

    <nav
      aria-label="Navegación móvil"
      class="fixed inset-x-0 bottom-0 z-50 border-t ui-divider bg-[var(--bg-shell)]/95 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-xl md:hidden"
    >
      <ul class="grid grid-cols-6 gap-1.5">
        <li v-for="item in navItems" :key="`mobile-${item.path}`">
          <NuxtLink
            :href="item.path"
            class="flex min-h-12 flex-col items-center justify-center rounded-xl px-1.5 py-1.5 text-[11px] font-medium"
            :class="$route.path === item.path ? 'ui-chip'
                : 'ui-muted hover:bg-[var(--color-surface-3)] hover:text-white'
            "
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="h-4 w-4"
            >
              <path :d="item.iconPath" />
            </svg>
            <span>{{ item.shortLabel }}</span>
          </NuxtLink>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { Toaster } from "vue-sonner";

const runtimeConfig = useRuntimeConfig();
const appVersion = computed(
  () => runtimeConfig.public.appVersion || "0.0.0-local",
);
const appCommitShort = computed(() => {
  const sha = String(runtimeConfig.public.appCommitSha || "").trim();
  return sha ? sha.slice(0, 7) : "";
});

const navItems = [
  {
    path: "/",
    label: "Menús",
    shortLabel: "Menús",
    iconPath: "M3 5h18M3 12h18M3 19h18",
  },
  {
    path: "/recipes",
    label: "Recetas",
    shortLabel: "Recetas",
    iconPath: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 7H20v12H6.5A2.5 2.5 0 0 0 4 21z",
  },
  {
    path: "/ingredients",
    label: "Ingredientes",
    shortLabel: "Ingr.",
    iconPath: "M12 3v18M3 12h18",
  },
  {
    path: "/generar",
    label: "Generar",
    shortLabel: "Generar",
    iconPath: "M4 12h11M11 5l7 7-7 7",
  },
  {
    path: "/history",
    label: "Rotativos",
    shortLabel: "Rota",
    iconPath: "M3 12a9 9 0 1 0 3-6.7M3 4v6h6",
  },
  {
    path: "/config",
    label: "Config",
    shortLabel: "Config",
    iconPath: "M12 8.5a3.5 3.5 0 1 0 0 7a3.5 3.5 0 0 0 0-7zm8.5 3.5l-2 .8a6.8 6.8 0 0 1-.5 1.2l1.1 1.9l-1.4 1.4l-1.9-1.1a6.8 6.8 0 0 1-1.2.5l-.8 2h-2l-.8-2a6.8 6.8 0 0 1-1.2-.5l-1.9 1.1l-1.4-1.4l1.1-1.9a6.8 6.8 0 0 1-.5-1.2l-2-.8v-2l2-.8a6.8 6.8 0 0 1 .5-1.2L5.7 6.6L7.1 5.2L9 6.3a6.8 6.8 0 0 1 1.2-.5l.8-2h2l.8 2a6.8 6.8 0 0 1 1.2.5l1.9-1.1l1.4 1.4l-1.1 1.9a6.8 6.8 0 0 1 .5 1.2l2 .8z",
  },
];
</script>
