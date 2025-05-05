<script setup lang="ts">
import { useToast } from '~/components/ui/toast/use-toast'

const props = defineProps<{ amount: number }>()

const { copy } = useClipboard()
const { toast } = useToast()
const { t } = useI18n()

const names = ref<string[]>([])

onMounted(() => generate())

function generate(): void {
  names.value = []

  for (let i = 0; i < props.amount; i++) {
    names.value.push(randomName())
  }
}

function handleCopy(name: string): void {
  copy(name)

  toast({
    title: t('components.nameGenerator.toast.title', { name }),
    variant: 'info',
  })
}
</script>

<template>
  <MasonryGrid
    v-if="names.length"
    v-slot="{ column }"
    :data="names"
    :max-columns="2"
    wrapper-style="grid list-disc list-inside gap-x-6"
    column-style="flex flex-col gap-1"
    element="ol"
  >
    <li
      v-for="name in column"
      :key="name"
      class="cursor-copy"
      @click="handleCopy(name)"
    >
      {{ name }}
    </li>
  </MasonryGrid>
  <SkeletonList
    v-else
    :amount="amount"
  />

  <div class="flex w-full justify-end gap-2 items-center mt-4">
    <p class="text-muted-foreground text-2xs">
      {{ $t('pages.fantasyNameGenerator.tip') }}
    </p>
    <button
      data-test-generate
      :disabled="!names.length"
      class="btn-primary"
      @click="generate"
    >
      {{ $t('actions.generate') }}
    </button>
  </div>
</template>
