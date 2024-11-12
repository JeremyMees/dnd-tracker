<script setup lang="ts">
const props = defineProps<{
  label: Record<string, string>
  icon: string
  background: string
  color: string
  description: Record<string, string>
  earned: number
}>()

const { locale } = useI18n()

const date = computed<string>(() => {
  const dateString = new Date(props.earned)

  return dateString.toLocaleDateString(locale.value === 'nl' ? 'nl-NL' : 'en-US')
})
</script>

<template>
  <tippy trigger="click">
    <button
      class="px-2 py-1 flex items-center gap-2 rounded-lg font-bold border-4"
      :style="{
        'background-color': `${background}80`,
        'border-color': background,
        color,
      }"
    >
      <Icon
        :name="icon"
        width="22"
        height="22"
      />
      {{ label[locale] }}
    </button>
    <template #content>
      <div class="p-4 overflow-auto space-y-2">
        <p class="head-3">
          {{ label[locale] }}
        </p>
        <div class="text-[10px] bg-bg w-fit px-2 py-1 rounded-lg">
          {{ date }}
        </div>
        <p>
          {{ description[locale] }}
        </p>
      </div>
    </template>
  </tippy>
</template>
