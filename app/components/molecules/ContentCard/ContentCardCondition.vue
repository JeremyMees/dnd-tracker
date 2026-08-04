<script setup lang="ts">
defineProps<{
  content: DndCondition
  isOpen: boolean
}>()

const { renderMarkdown } = useMarkdown()
</script>

<template>
  <div class="text-sm">
    <div
      v-if="content.desc"
      v-dompurify-html="renderMarkdown(content.desc)"
      data-test-desc
      class="md-richtext text-muted-foreground"
      :class="{
        'line-clamp-3': !isOpen,
      }"
    />
  </div>
</template>
