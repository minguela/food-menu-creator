<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Navegación -->
    <nav class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <NuxtLink href="/" class="text-xl font-bold text-indigo-600">
              🍽️ MenuPlanner
            </NuxtLink>
          </div>
          <div class="flex items-center space-x-4">
            <NuxtLink
              href="/"
              class="px-3 py-2 rounded-md text-sm font-medium"
              :class="$route.path === '/' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'"
            >
              Menús
            </NuxtLink>
            <NuxtLink
              href="/generar"
              class="px-3 py-2 rounded-md text-sm font-medium"
              :class="$route.path === '/generar' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'"
            >
              Generar
            </NuxtLink>
          </div>
        </div>
      </div>
    </nav>

    <!-- Contenido principal -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <NuxtPage />
    </main>
  </div>
</template>

<script setup lang="ts">
</script>
