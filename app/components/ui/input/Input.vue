<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { useVModel } from '@vueuse/core'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  defaultValue?: string | number
  modelValue?: string | number
  type?: string
  class?: HTMLAttributes['class']
}>()

const emits = defineEmits<{
  (e: 'update:modelValue', payload: string | number | undefined): void
}>()

const modelValue = useVModel(props, 'modelValue', emits, {
  passive: true,
  defaultValue: props.defaultValue,
})

const attrs = useAttrs()

const inputAttrs = computed(() => {
  const { onInput: _onInput, onChange: _onChange, ...rest } = attrs

  return rest
})

function onInput(event: Event): void {
  const value = (event.target as HTMLInputElement).value

  if (props.type === 'number') {
    modelValue.value = value === '' ? undefined : Number(value)
  } else {
    modelValue.value = value
  }
}
</script>

<template>
  <input
    v-bind="inputAttrs"
    :type="type"
    :value="modelValue"
    :class="
      cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        props.class,
      )
    "
    @input="onInput"
  />
</template>
