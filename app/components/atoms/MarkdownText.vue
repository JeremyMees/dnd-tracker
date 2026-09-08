<script setup lang="ts">
const props = defineProps<{ text: string }>()

const { renderMarkdown } = useMarkdown()

const html = computed(() => renderMarkdown(props.text))
</script>

<template>
  <div v-html="html" />
</template>
