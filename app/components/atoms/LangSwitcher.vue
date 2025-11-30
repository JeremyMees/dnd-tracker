<script setup lang="ts">
import type { AcceptableValue } from 'reka-ui'

const { locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()

function setLang(lang: AcceptableValue): void {
  if (
    typeof lang !== 'string'
    || !['nl', 'en'].includes(lang)
  ) return

  navigateTo(switchLocalePath(lang as 'nl' | 'en'))
}
</script>

<template>
  <div class="flex items-center justify-between gap-2">
    <Icon
      name="tabler:world"
      class="size-3 min-w-3"
    />
    <UiSelect
      :model-value="locale"
      @update:model-value="setLang($event)"
    >
      <UiSelectTrigger>
        <UiSelectValue />
      </UiSelectTrigger>
      <UiSelectContent>
        <UiSelectGroup>
          <UiSelectItem
            v-for="{ code, name } in locales"
            :key="code"
            :value="code"
          >
            {{ name }}
          </UiSelectItem>
        </UiSelectGroup>
      </UiSelectContent>
    </UiSelect>
  </div>
</template>
