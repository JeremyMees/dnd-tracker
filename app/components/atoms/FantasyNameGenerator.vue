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

  <div class="flex flex-col w-full gap-2 mt-4">
    <div class="text-muted-foreground flex gap-2 items-center">
      <Icon
        name="tabler:info-circle"
        class="text-info"
      />
      <p class="text-xs">
        {{ $t('pages.fantasyNameGenerator.tip') }}
      </p>
    </div>
    <UiButton
      data-test-generate
      :disabled="!names.length"
      class="self-end"
      @click="generate"
    >
      {{ $t('actions.generate') }}
    </UiButton>
  </div>
</template>
