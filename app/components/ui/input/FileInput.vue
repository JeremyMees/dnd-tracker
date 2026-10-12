<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<{ class?: HTMLAttributes['class'] }>()

const model = defineModel<File>()

const attrs = useAttrs()

const inputAttrs = computed(() => {
  const { onInput: _onInput, onChange: _onChange, ...rest } = attrs

  return rest
})

function onChange(event: Event): void {
  model.value = (event.target as HTMLInputElement).files?.[0]
}
</script>

<template>
  <input
    v-bind="inputAttrs"
    type="file"
    :class="
      cn(
        'flex w-full cursor-pointer rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:mr-3 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        props.class,
      )
    "
    @change="onChange"
  />
</template>
