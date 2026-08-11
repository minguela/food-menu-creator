<script setup lang="ts">
const route = useRoute()
const id = computed(() => route.params.id)
useHead({ title: `Menú rotativo ${id.value} — Food Menu Creator` })
</script>
<template>
  <div class="min-h-screen bg-transparent max-w-4xl mx-auto px-4 py-8">
    <NuxtLink to="/" class="text-slate-400 hover:text-white mb-4 inline-block">← Volver</NuxtLink>
    <h1 class="text-3xl font-bold mb-6">🔄 Menú rotativo {{ id }}</h1>
    <div class="p-6 rounded-2xl bg-white/5 border border-white/10">
      <p class="text-slate-400">Detalle del menú rotativo. La lógica de rotación se mantiene en el servidor.</p>
    </div>
  </div>
</template>
