export default defineNuxtConfig({
  devtools: { enabled: false },
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  ui: {
    primary: 'red',
    gray: 'cool',
  },
  compatibilityDate: '2024-11-01',

  app: {
    head: {
      titleTemplate: (title) => title ? `${title} — Sked` : 'Sked · JHS Auto-Scheduler',
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      ],
    },
  },

  nitro: {
    // better-sqlite3 uses native bindings; postgres must also stay external for ESM compat
    externals: {
      external: ['better-sqlite3', 'postgres'],
    },
  },
})
