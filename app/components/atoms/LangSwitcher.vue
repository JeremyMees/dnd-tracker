<script setup lang="ts">
import type { AcceptableValue } from 'reka-ui'

const { locale, locales } = useI18n({ useScope: 'global' })
const switchLocalePath = useSwitchLocalePath()
const config: { locale: string } | undefined = inject(Symbol.for('FormKitConfig'))

onMounted(() => setLang(locale.value))

function setLang(lang: AcceptableValue): void {
  if (
    typeof lang !== 'string'
    || !['nl', 'en'].includes(lang)
  ) return

  if (config) config.locale = lang

  navigateTo(switchLocalePath(lang as 'nl' | 'en'))
}
</script>

<template>
  <div class="flex items-center justify-between gap-2">
    <Icon
      name="tabler:world"
      class="size-4 min-w-4"
    />
    <UiSelectBase
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
    </UiSelectBase>
  </div>
</template>
