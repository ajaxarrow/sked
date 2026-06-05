<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white border-b px-6 py-3 flex items-center gap-6">
      <NuxtLink to="/" class="font-bold text-primary-600 text-lg tracking-tight">Sked</NuxtLink>
      <NuxtLink to="/" class="text-sm text-gray-600 hover:text-gray-900">Schools</NuxtLink>
    </nav>
    <main>
      <slot />
    </main>
  </div>
</template>
