<script setup lang="ts">
const emit = defineEmits<{
  import: [File]
}>()

defineProps<{
  disabled?: boolean
  loading?: boolean
  accept?: string
}>()

const input = ref<HTMLInputElement>()

function onChange(event: Event): void {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) emit('import', file)

  target.value = ''
}
</script>

<template>
  <ClientOnly>
    <UiSkeleton v-if="loading" test-id="skeleton" class="w-[90px] h-[32px]" />
    <template v-else>
      <UiButton
        test-id="import"
        size="sm"
        variant="secondary"
        :disabled="disabled"
        @click="input?.click()"
      >
        <Icon name="tabler:file-import" aria-hidden="true" />
        {{ $t('actions.import') }}
      </UiButton>
      <input
        ref="input"
        test-id="import-input"
        type="file"
        :accept="accept ?? 'application/json,.json'"
        class="hidden"
        @change="onChange"
      />
    </template>

    <template #fallback>
      <UiSkeleton class="w-[90px] h-[32px]" />
    </template>
  </ClientOnly>
</template>
