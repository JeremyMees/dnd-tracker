<script setup lang="ts">
const anchor = ref<HTMLElement | null>(null)
const colorMode = useColorMode()

function update(preference: string): void {
  revealTransition(() => {
    colorMode.preference = preference
  }, anchor.value)
}
</script>

<template>
  <div ref="anchor" class="flex items-center justify-between gap-2">
    <Icon name="tabler:palette" class="size-3 min-w-3" />
    <UiSelect
      :model-value="colorMode.preference"
      @update:model-value="update($event as string)"
    >
      <UiSelectTrigger>
        <UiSelectValue />
      </UiSelectTrigger>
      <UiSelectContent>
        <UiSelectGroup>
          <UiSelectItem value="light">
            {{ $t('components.colorModeSwitcher.light') }}
          </UiSelectItem>
          <UiSelectItem value="dark">
            {{ $t('components.colorModeSwitcher.dark') }}
          </UiSelectItem>
          <UiSelectItem value="system">
            {{ $t('components.colorModeSwitcher.system') }}
          </UiSelectItem>
        </UiSelectGroup>
      </UiSelectContent>
    </UiSelect>
  </div>
</template>
