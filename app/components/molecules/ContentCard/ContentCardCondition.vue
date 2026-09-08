<script setup lang="ts">
defineProps<{
  content: DndCondition
  isOpen: boolean
}>()
</script>

<template>
  <div class="text-sm">
    <MarkdownText
      v-if="content.desc"
      :text="content.desc"
      test-id="desc"
      class="md-richtext text-muted-foreground"
      :class="{
        'line-clamp-3': !isOpen,
      }"
    />
  </div>
</template>
