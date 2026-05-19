<script setup lang="ts">
import type { ModalVariant } from '~/types/component'

defineEmits<{ close: [] }>()

withDefaults(
  defineProps<{
    variant?: ModalVariant
    header?: string
    subHeader?: string
  }>(), {
    variant: 'default',
    header: '',
    subHeader: '',
  },
)
</script>

<template>
  <UiDialog open>
    <UiDialogContent
      :class="{
        'max-w-xl': variant === 'default',
        'max-w-[1000px]': variant === 'big',
        'inset-0 translate-x-0 translate-y-0 max-h-dvh gap-0 border-0 rounded-none!': variant === 'fullScreen',
      }"
      @escape-key-down="$emit('close')"
      @pointer-down-outside="$emit('close')"
      @interact-outside="$emit('close')"
      @close="$emit('close')"
    >
      <UiDialogHeader>
        <UiDialogTitle>
          {{ header }}
        </UiDialogTitle>
        <UiDialogDescription v-if="subHeader">
          {{ subHeader }}
        </UiDialogDescription>
      </UiDialogHeader>

      <div class="overflow-y-auto mt-4">
        <slot />
      </div>
    </UiDialogContent>
  </UiDialog>
</template>
