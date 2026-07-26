export default {
  '**/*.{js,ts,vue,css,json}': () => ['eslint .', 'prettier . --check'],
  '**/*.{js,ts,vue}': () => 'nuxt typecheck',
}
