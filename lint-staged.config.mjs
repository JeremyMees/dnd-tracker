export default {
  '*.{js,mjs,ts,vue}': [
    'eslint --no-warn-ignored',
    'prettier --check',
    () => 'nuxt typecheck',
  ],
  '*.{css,json,md,yml,yaml}': 'prettier --check --ignore-unknown',
}
