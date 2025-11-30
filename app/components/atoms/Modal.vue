<script setup lang="ts">
const emit = defineEmits<{ close: [] }>()

withDefaults(
  defineProps<{
    big?: boolean
    header?: string
    subHeader?: string
  }>(), {
    big: false,
    header: '',
    subHeader: '',
  },
)
</script>

<template>
  <UiDialog open>
    <UiDialogContent
      :class="[big ? 'max-w-[1000px]' : 'max-w-xl']"
      @escape-key-down="emit('close')"
      @pointer-down-outside="emit('close')"
      @interact-outside="emit('close')"
      @close="emit('close')"
    >
      <UiDialogHeader>
        <UiDialogTitle>
          {{ header }}
        </UiDialogTitle>
        <UiDialogDescription v-if="subHeader">
          {{ subHeader }}
        </UiDialogDescription>
      </UiDialogHeader>

      <div class="overflow-y-auto">
        <slot />
      </div>
    </UiDialogContent>
  </UiDialog>
</template>
