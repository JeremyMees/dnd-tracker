<script setup lang="ts">
defineProps<{
  title: string
  items: {
    title: string
    content: string
  }[]
}>()
</script>

<template>
  <div class="flex flex-col gap-4 max-w-4xl w-full">
    <h2 class="mx-auto">
      {{ title }}
    </h2>
    <UiAccordion
      type="single"
      collapsible
      class="border-4 border-secondary bg-secondary/50 rounded-lg p-4"
    >
      <UiAccordionItem
        v-for="item in items"
        :key="item.title"
        :value="item.title"
      >
        <UiAccordionTrigger class="text-base">
          {{ item.title }}
        </UiAccordionTrigger>
        <UiAccordionContent class="text-base">
          {{ item.content }}
        </UiAccordionContent>
      </UiAccordionItem>
    </UiAccordion>
  </div>
</template>
