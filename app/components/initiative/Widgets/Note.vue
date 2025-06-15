<script setup lang="ts">
const emit = defineEmits<{ update: [string] }>()

const props = defineProps<{ value: string }>()

const text = ref<string>(props.value)
const debouncedText = refDebounced(text, 500, { maxWait: 1000 })

watch(
  () => props.value,
  (newValue) => {
    if (newValue !== text.value) text.value = newValue || ''
  },
)

watch(debouncedText, () => emit('update', debouncedText.value))
</script>

<template>
  <TextEditor
    color="secondary"
    :content="text"
    @updated="text = $event"
  />
</template>
