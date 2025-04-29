<script setup lang="ts">
defineProps<{
  label: Record<string, string>
  icon: string
  background: string
  description: Record<string, string>
  earned: number
}>()

const { locale } = useI18n()
</script>

<template>
  <tippy trigger="click">
    <button
      class="px-2 py-1 flex items-center gap-2 rounded-lg font-bold border-4"
      :style="{
        'background-color': `${background}80`,
        'border-color': background,
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
        <NuxtTime
          class="text-xs text-muted-foreground"
          :datetime="earned"
          month="numeric"
          day="numeric"
          year="numeric"
        />
        <p>
          {{ description[locale] }}
        </p>
      </div>
    </template>
  </tippy>
</template>
