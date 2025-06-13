import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    ignores: ['./nuxt.config.ts'],
  },
).overrideRules({ 'vue/multi-word-component-names': 'off' })
