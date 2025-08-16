// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt([
    {
        rules: {
            'vue/require-default-prop': 'off',
            'vue/no-multiple-template-root': 'off',
            '@typescript-eslint/unified-signatures': 'off',
            'vue/html-self-closing': 'off',
            '@typescript-eslint/no-extraneous-class': 'off',
            'vue/multi-word-component-names': 'off'
        }
    }
])
