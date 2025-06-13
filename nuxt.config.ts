// eslint-disable
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  modules: [
    '@nuxt/ui',
    '@nuxt/eslint',
    '@nuxt/image',
    '@vueuse/nuxt',
    '@pinia/nuxt',
    '@nuxtjs/i18n',
    '@nuxt/content',
  ],

  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],

  colorMode: {
    preference: 'light',
  },
  future: {
    compatibilityVersion: 4,
  },
  compatibilityDate: '2024-11-01',
  eslint: {
    config: {
      stylistic: true,
    },
  },

  icon: {
    provider: "iconify",
    clientBundle: {
      scan: true,
    }
  },

  i18n: {
    defaultLocale: 'en',
    locales: [
      {
        code: 'en',
        name: 'English',
        file: 'en.json',
      },
      {
        code: 'de',
        name: 'German',
        file: 'de.json',
      },
    ],
  },

})
