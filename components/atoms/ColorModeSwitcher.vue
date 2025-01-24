<template>
  <div class="flex items-center justify-between gap-2">
    <Icon
      name="tabler:palette"
      class="size-4 min-w-4"
    />
    <UiSelect v-model="$colorMode.preference">
      <UiSelectTrigger>
        <UiSelectValue />
      </UiSelectTrigger>
      <UiSelectContent>
        <UiSelectGroup>
          <UiSelectItem value="light">
            Light
          </UiSelectItem>
          <UiSelectItem value="dark">
            Dark
          </UiSelectItem>
          <UiSelectItem value="system">
            System
          </UiSelectItem>
        </UiSelectGroup>
      </UiSelectContent>
    </UiSelect>
  </div>
</template>
