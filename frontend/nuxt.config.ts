// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-05-15",
  devtools: { enabled: true },
  ssr: false,
  debug: false,

  css: [
    "~/assets/css/main.css",
    "@fortawesome/fontawesome-free/css/all.css"
  ],

  vite: {
    plugins: [tailwindcss()],
  },

  modules: ["@nuxt/icon", "@nuxt/image", "@pinia/nuxt", "pinia-plugin-persistedstate/nuxt", 'nuxt-toast', '@nuxt/ui'],

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
      ],
      script: [
        { src: 'https://app.sandbox.midtrans.com/snap/snap.js', 'data-client-key': process.env.NUXT_PUBLIC_MIDTRANS_CLIENT_KEY }
      ]
    }
  },

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL,
    },
  },
});