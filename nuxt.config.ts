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
    // better-sqlite3 uses native bindings — must stay external, not bundled
    externals: {
      external: ['better-sqlite3'],
    },
  },
})
