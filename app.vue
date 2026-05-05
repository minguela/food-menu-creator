<template>
  <div class="min-h-screen overflow-x-hidden">
    <header class="sticky top-0 z-40 border-b bg-[#18181bdd] backdrop-blur-xl">
      <div
        class="mx-auto flex h-16 w-full max-w-7xl items-center px-4 sm:px-6 lg:px-8"
      >
        <NuxtLink
          href="/"
          class="text-lg font-bold tracking-tight text-sky-300"
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
            :class="
              $route.path === item.path
                ? 'ui-chip'
                : 'text-zinc-300 hover:bg-zinc-800'
            "
          >
            {{ item.label }}
          </NuxtLink>
        </nav>
        <div class="ml-3 hidden text-right text-[11px] text-zinc-400 lg:block">
          <p>v{{ appVersion }}</p>
          <p v-if="appCommitShort">{{ appCommitShort }}</p>
        </div>
      </div>
    </header>

    <main
      class="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-8"
    >
      <NuxtPage />
    </main>

    <nav
      aria-label="Navegación móvil"
      class="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-700 bg-[#16161ce8] p-2 backdrop-blur-xl md:hidden"
    >
      <div class="mb-2 text-center text-[10px] text-zinc-400">
        v{{ appVersion
        }}<span v-if="appCommitShort"> · {{ appCommitShort }}</span>
      </div>
      <ul class="grid grid-cols-6 gap-2">
        <li v-for="item in navItems" :key="`mobile-${item.path}`">
          <NuxtLink
            :href="item.path"
            class="flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[11px] font-medium"
            :class="
              $route.path === item.path
                ? 'ui-chip'
                : 'text-zinc-300 hover:bg-zinc-800'
            "
          >
            <span class="text-sm">{{ item.icon }}</span>
            <span>{{ item.shortLabel }}</span>
          </NuxtLink>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script setup lang="ts">
const runtimeConfig = useRuntimeConfig();
const appVersion = computed(
  () => runtimeConfig.public.appVersion || "0.0.0-local",
);
const appCommitShort = computed(() => {
  const sha = String(runtimeConfig.public.appCommitSha || "").trim();
  return sha ? sha.slice(0, 7) : "";
});

const navItems = [
  { path: "/", label: "Menús", shortLabel: "Menús", icon: "M" },
  { path: "/recipes", label: "Recetas", shortLabel: "Recetas", icon: "R" },
  {
    path: "/ingredients",
    label: "Ingredientes",
    shortLabel: "Ingr.",
    icon: "I",
  },
  { path: "/generar", label: "Generar", shortLabel: "Generar", icon: "G" },
  { path: "/history", label: "Rotativos", shortLabel: "Rota", icon: "T" },
  { path: "/config", label: "Config", shortLabel: "Config", icon: "A" },
];
</script>
