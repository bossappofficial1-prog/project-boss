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
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: 'BOSS - Business One Stop System' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'theme-color', content: '#dc2626' }
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
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:6789',
      midtransClientKey: process.env.NUXT_PUBLIC_MIDTRANS_CLIENT_KEY,
      appName: process.env.NUXT_PUBLIC_APP_NAME || 'BOSS',
      appVersion: process.env.NUXT_PUBLIC_APP_VERSION || '1.0.0',
      baseUrl: process.env.NUXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    },
  },
});