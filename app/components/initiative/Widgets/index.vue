<script setup lang="ts">
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'

const { sheet, update } = validateInject(INITIATIVE_SHEET)

const popoverOpen = shallowRef(false)

const isModified = computed(() => sheet.value?.settings?.modified ?? false)

const widgets = computed(() => {
  const allowed = ['note', 'info-pins']
  const data = sheet.value?.settings?.widgets ?? []
  return allowed.filter(widget => data.includes(widget))
})

interface WidgetSettingsForm {
  widgets: string[]
}

async function handleSubmit(form: WidgetSettingsForm, node: FormNode): Promise<void> {
  if (!sheet.value) return

  node.clearErrors()

  await update({
    settings: {
      ...sheet.value?.settings,
      ...sanitizeForm<WidgetSettingsForm>(form),
      modified: true,
    },
  })

  popoverOpen.value = false
}
</script>

<template>
  <div class="pt-4 mt-4 space-y-2 border-t">
    <div class="flex items-center gap-1">
      <h3>
        {{ $t('general.widget', 2) }}
      </h3>

      <UiPopover v-model:open="popoverOpen">
        <UiPopoverTrigger as-child>
          <button class="icon-btn-foreground">
            <Icon
              name="tabler:settings"
              class="size-4 min-w-4"
            />
          </button>
        </UiPopoverTrigger>
        <UiPopoverContent>
          <FormKit
            id="WidgetSettings"
            type="form"
            :submit-label="$t('actions.save')"
            @submit="handleSubmit"
          >
            <FormActiveWidgets
              :settings="sheet?.settings"
              fieldset-class="$reset "
              no-label
            />
          </FormKit>
        </UiPopoverContent>
      </UiPopover>
    </div>

    <div
      v-if="widgets.length || !isModified"
      class="grid xl:grid-cols-2 gap-2 items-start"
    >
      <LazyInitiativeWidgetsNote
        v-if="widgets.includes('note') || !isModified"
        hydrate-on-idle
        :value="sheet?.info ?? ''"
        @update="update({ info: $event })"
      />
      <LazyInitiativeWidgetsPinnedContent
        v-if="widgets.includes('info-pins') || !isModified"
        hydrate-on-idle
        :value="sheet?.info_cards ?? []"
        @update="update({ info_cards: $event })"
      />
    </div>
    <p
      v-else
      class="text-muted-foreground text-sm"
    >
      {{ $t('components.initiativeSettings.noActiveWidgets') }}
    </p>
  </div>
</template>
