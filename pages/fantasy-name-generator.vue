<script setup lang="ts">
useSeo('Fantasy name generator')

const { copy } = useClipboard()
const toast = useToast()
const { t } = useI18n()

const names = ref<string[]>([])

onMounted(() => generate())

function generate(): void {
  names.value = []

  for (let i = 0; i < 30; i++) {
    names.value.push(useRandomName())
  }
}

function handleCopy(name: string): void {
  copy(name)

  toast.info({
    title: t('components.nameGenerator.toast.title', { name }),
    timeout: 2000,
  })
}
</script>

<template>
  <NuxtLayout container>
    <div class="flex flex-col pt-6 pb-16 gap-10">
      <h1 class="mb-4 sm:text-4xl xl:text-5xl text-center">
        {{ t('pages.fantasyNameGenerator.title') }}
      </h1>
      <p class="mb-5 max-w-3xl mx-auto text-center pb-10">
        {{ t('pages.fantasyNameGenerator.description') }}
      </p>
      <div class="relative p-6 border-4 border-bg bg-bg-light/50 rounded-lg max-w-prose mx-auto w-full">
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
        <div class="flex justify-end gap-2 items-center pt-6">
          <p class="text-slate-300 body-extra-small">
            {{ t('pages.fantasyNameGenerator.tip') }}
          </p>
          <button
            :disabled="!names.length"
            class="btn-primary"
            @click="generate"
          >
            {{ t('actions.generate') }}
          </button>
        </div>
        <div class="abolsute inset-0 z-[-1] fancy-shadow" />
      </div>
    </div>
  </NuxtLayout>
</template>
