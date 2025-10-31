<template>
  <div class="flex items-center justify-between gap-2">
    <Icon
      name="tabler:palette"
      class="size-3 min-w-3"
    />
    <UiSelect v-model="$colorMode.preference">
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
