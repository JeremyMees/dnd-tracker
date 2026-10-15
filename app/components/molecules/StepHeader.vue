<script setup lang="ts">
defineEmits<{ back: [] }>()

withDefaults(
  defineProps<{
    title: string
    description?: string
    titleId?: string
    back?: boolean
    center?: boolean
  }>(),
  {
    description: undefined,
    titleId: undefined,
    back: false,
    center: false,
  },
)
</script>

<template>
  <header
    class="flex flex-col gap-2"
    :class="center ? 'items-center text-center' : 'items-start'"
  >
    <UiButton
      v-if="back"
      test-id="step-back"
      type="button"
      variant="foreground-ghost"
      size="sm"
      class="self-start"
      @click="$emit('back')"
    >
      <Icon name="tabler:arrow-left" aria-hidden="true" />
      {{ $t('actions.back') }}
    </UiButton>
    <div>
      <h3 :id="titleId" class="text-xl sm:text-2xl font-semibold text-balance">
        {{ title }}
      </h3>
      <p
        v-if="description || $slots.description"
        test-id="step-description"
        class="mt-1 text-sm text-muted-foreground text-pretty"
      >
        <slot name="description">{{ description }}</slot>
      </p>
    </div>
  </header>
</template>
