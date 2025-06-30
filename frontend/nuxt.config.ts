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

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL,
    },
  },

  nitro: {
    preset: 'node-server'
  }
});
