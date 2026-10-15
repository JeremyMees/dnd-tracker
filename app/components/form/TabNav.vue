<script setup lang="ts">
defineEmits<{ back: []; next: [] }>()

withDefaults(
  defineProps<{
    canGoBack: boolean
    canGoForward: boolean
    backLabel?: string
    submitLabel?: string
  }>(),
  { backLabel: undefined, submitLabel: undefined },
)
</script>

<template>
  <div class="flex justify-end gap-2">
    <Tooltip :text="backLabel ?? $t('actions.prev')">
      <UiButton
        test-id="prev"
        type="button"
        variant="foreground"
        size="icon"
        class="min-w-10"
        :aria-label="backLabel ?? $t('actions.prev')"
        :disabled="!canGoBack"
        @click="$emit('back')"
      >
        <Icon name="tabler:arrow-left" aria-hidden="true" />
      </UiButton>
    </Tooltip>
    <Tooltip :text="$t('actions.next')">
      <UiButton
        test-id="next"
        type="button"
        variant="foreground"
        size="icon"
        class="min-w-10"
        :aria-label="$t('actions.next')"
        :disabled="!canGoForward"
        @click="$emit('next')"
      >
        <Icon name="tabler:arrow-right" aria-hidden="true" />
      </UiButton>
    </Tooltip>
    <UiButton test-id="submit" type="submit" class="w-full md:w-fit">
      {{ submitLabel ?? $t('actions.save') }}
    </UiButton>
  </div>
</template>
