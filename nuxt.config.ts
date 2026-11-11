// eslint-disable
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

function resolveAppVersion(): string {
  if (process.env.GITHUB_REF_NAME) return process.env.GITHUB_REF_NAME
  try {
    return execSync('git describe --tags --always', {
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString().trim() || 'dev'
  }
  catch {
    return 'dev'
  }
}

function resolveParserVersion(): string {
  const pkg = JSON.parse(
    readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf8'),
  ) as { dependencies?: Record<string, string>, devDependencies?: Record<string, string> }
  return pkg.dependencies?.['@w2a-iiot/parsers']
    ?? pkg.devDependencies?.['@w2a-iiot/parsers']
    ?? 'unknown'
}

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  ssr: process.env.NODE_ENV !== 'development',

  app: {
    head: {
      title: "Home",
      link: [
        // https://nuxt.com/deploy/github-pages and https://vite.dev/guide/env-and-mode.html for details.
        // !!! Make use of compile time environment var NUXT_APP_BASE_URL to work for GitHub Pages deployments as well.
        // Assumption: favicon files in ~/public as ~/public/favicon.ico, ~/public/favicon-32x32.png etc.:
        {
          rel: "icon",
          type: "image/x-icon",
          href: (import.meta.env.NUXT_APP_BASE_URL ? import.meta.env.NUXT_APP_BASE_URL : "/") + "favicon.ico"
        },
       // ... add probable other icon variants accordingly

        {
          rel: "preload",
          as: "font",
          type: "font/woff2",
          crossorigin: "anonymous",
          href: (import.meta.env.NUXT_APP_BASE_URL ? import.meta.env.NUXT_APP_BASE_URL : "/") + "fonts/inter-latin-400-normal.woff2"
        }
      ],
    },
  },

  modules: [
    '@nuxt/ui',
    '@nuxt/eslint',
    '@nuxt/image',
    '@vueuse/nuxt',
    '@nuxtjs/i18n',
    '@nuxt/content',
  ],

  content: {
    experimental: {
      nativeSqlite: true,
    },
  },

  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      appVersion: resolveAppVersion(),
      parserVersion: resolveParserVersion(),
    },
  },

  nitro: {
    prerender: {

      crawlLinks: true,
      routes: ['/', '/parsers'],
    },
  },

  components: [
    { path: '~/components/content', global: true },
    '~/components',
  ],

  colorMode: {
    preference: 'light',
    fallback: 'light',
  },

  hooks: {

    'pages:extend': function (pages) {
      const force = (list: typeof pages): void => {
        for (const page of list) {
          page.meta = { ...page.meta, colorMode: 'light' }
          if (page.children?.length) force(page.children)
        }
      }
      force(pages)
    },
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

    strategy: "no_prefix",
    locales: [
      {
        code: 'en',
        name: 'English',
        file: 'en.json',
      },
    ],
  },

})
