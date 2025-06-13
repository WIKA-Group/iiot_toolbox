// eslint-disable
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  app: {
    head: {
      title: "My Page Title",
      link: [
        // https://nuxt.com/deploy/github-pages and https://vite.dev/guide/env-and-mode.html for details.
        // !!! Make use of compile time environment var NUXT_APP_BASE_URL to work for GitHub Pages deployments as well.
        // Assumption: favicon files in ~/public as ~/public/favicon.ico, ~/public/favicon-32x32.png etc.:
        {
          rel: "icon",
          type: "image/x-icon",
          href: (import.meta.env.NUXT_APP_BASE_URL ? import.meta.env.NUXT_APP_BASE_URL : "/") + "favicon.ico"
        }
       // ... add probable other icon variants accordingly
      ],
    },
  },


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
