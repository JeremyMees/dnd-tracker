<script setup lang="ts">
import { useToast } from '~/components/ui/toast/use-toast'

useSeo('Fantasy name generator')

const { copy } = useClipboard()
const { toast } = useToast()
const { t } = useI18n()

const names = ref<string[]>([])

onMounted(() => generate())

function generate(): void {
  names.value = []

  for (let i = 0; i < 30; i++) {
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
  <NuxtLayout
    name="sidebar"
    :header="$t('components.navbar.fantasy')"
  >
    <div class="flex flex-col justify-center h-full">
      <UiCard class="w-full dnd-container">
        <UiCardContent class="pt-6">
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
            :amount="15"
          />
        </UiCardContent>
        <UiCardFooter>
          <div class="flex w-full justify-end gap-2 items-center">
            <p class="text-muted-foreground body-extra-small">
              {{ $t('pages.fantasyNameGenerator.tip') }}
            </p>
            <button
              :disabled="!names.length"
              class="btn-primary"
              @click="generate"
            >
              {{ $t('actions.generate') }}
            </button>
          </div>
        </UiCardFooter>
      </UiCard>
    </div>
  </NuxtLayout>
</template>
