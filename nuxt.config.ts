import { defineNuxtConfig } from "nuxt/config"

export default defineNuxtConfig({
  server: {
    host: '0.0.0.0',
    port: 3000
  },
  modules: ["@pinia/nuxt", "@nuxtjs/tailwindcss"],
css: [
  "devextreme/dist/css/dx.light.css",
  "vuetify/styles",
  "@mdi/font/css/materialdesignicons.css",
],
  build: {
    transpile: ["vuetify", "devextreme-vue"],
  },
  vite: {
    define: {
      "process.env.DEBUG": false,
    },
    resolve: {
      alias: {
        "devextreme/core/utils/callbacks": "devextreme/cjs/core/utils/callbacks.js",
      },
    },
  },
  compatibilityDate: "2025-03-12",
})