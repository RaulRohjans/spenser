// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt([
  {
    rules: {
      "vue/require-default-prop": 'off',
      "vue/no-multiple-template-root": "off",
      "@typescript-eslint/unified-signatures": "off"
    }
  }
])
