export default defineNuxtConfig({
  modules: ['@pinia/nuxt'],
  css: [
    'devextreme/dist/css/dx.light.css',
    'vuetify/styles', 
    '@mdi/font/css/materialdesignicons.css'
  ],

  build: {
    transpile: ['vuetify', 'devextreme-vue']
  },

  vite: {
    define: {
      'process.env.DEBUG': false
    }
  },

  compatibilityDate: '2025-03-12'
});
