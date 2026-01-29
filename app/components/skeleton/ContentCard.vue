<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'secondary' | 'background'
  }>(), {
    variant: 'secondary',
  },
)
</script>

<template>
  <UiCard
    class="border-4"
    :class="{
      'bg-secondary/50 border-4 border-secondary': variant === 'secondary',
      'bg-background border-4 border-background': variant === 'background',
    }"
  >
    <UiCardHeader class="p-4">
      <UiCardTitle>
        <UiSkeleton class="w-[120px] h-7" />
      </UiCardTitle>
    </UiCardHeader>
    <UiCardContent class="px-4 py-0">
      <UiSkeleton class="w-full h-16" />
    </UiCardContent>
    <UiCardFooter class="pl-4 pr-0 pb-0 pt-2">
      <div class="flex justify-end w-full">
        <UiSkeleton class="w-[123px] h-10" />
      </div>
    </UiCardFooter>
  </UiCard>
</template>
