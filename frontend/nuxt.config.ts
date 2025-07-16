// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-05-15",
  devtools: { enabled: true },

  css: ["~/assets/css/main.css"],

  vite: {
    plugins: [tailwindcss()],
  },

  modules: ["@nuxt/icon", "@nuxt/image", "@pinia/nuxt", "pinia-plugin-persistedstate/nuxt"],

  ssr: false,

  icon: {
    provider: 'server',
    mode: "css",
    cssLayer: "base",
    serverBundle: {
      collections: ['lucide']
    },
    customCollections: [
      {
        prefix: 'boss',
        dir: './assets/icons'
      },
    ],
  },

  app: {
    head: {
      title: 'BOSS',
      meta: [
        { name: 'author', content: 'BOSS Team' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'BOSS - Business One Stop System' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/images/logo-color.svg' }
      ]
    }
  },

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL,
    },
  },
});
