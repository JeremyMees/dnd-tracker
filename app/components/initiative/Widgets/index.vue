<script setup lang="ts">
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { initiativeWidgets } from '~~/constants/validation'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import * as z from 'zod'

const { sheet, update } = validateInject(INITIATIVE_SHEET)

const popoverOpen = shallowRef(false)

const isModified = computed(() => sheet.value?.settings?.modified ?? false)

const widgets = computed(() => {
  const data = sheet.value?.settings?.widgets ?? []
  return initiativeWidgets.filter(widget => data.includes(widget))
})

watch(popoverOpen, (open) => {
  if (!open) return

  form.setValues({
    widgets: isModified.value
      ? (sheet.value?.settings?.widgets || [])
      : [...initiativeWidgets],
  })
})

const formSchema = toTypedSchema(z.object({
  widgets: z.array(z.enum(initiativeWidgets)),
}))

const form = useForm({
  validationSchema: formSchema,
})

const formError = ref<string>('')

const onSubmit = form.handleSubmit(async (values) => {
  if (!sheet.value) return

  formError.value = ''

  await update({
    settings: {
      ...sheet.value?.settings,
      ...values,
      modified: true,
    },
  })

  popoverOpen.value = false
})
</script>

<template>
  <div class="pt-4 mt-4 space-y-2 border-t">
    <div class="flex items-center gap-1">
      <h3>
        {{ $t('general.widget', 2) }}
      </h3>

      <UiPopover v-model:open="popoverOpen">
        <UiPopoverTrigger as-child>
          <UiButton
            v-tippy="$t('pages.encounter.update.widgets')"
            variant="foreground-ghost"
            size="icon-sm"
          >
            <Icon name="tabler:settings" />
          </UiButton>
        </UiPopoverTrigger>
        <UiPopoverContent>
          <h4 class="mb-4">
            {{ $t('pages.encounter.update.widgets') }}
          </h4>
          <UiFormWrapper @submit="onSubmit">
            <FormCheckboxGroup
              name="widgets"
              :options="[
                { label: $t('general.note'), value: 'note' },
                { label: $t('general.infoPins'), value: 'info-pins' },
              ]"
            />
            <div
              v-if="formError"
              class="text-sm text-destructive"
            >
              {{ formError }}
            </div>
            <UiButton
              type="submit"
              class="w-full"
            >
              {{ $t('actions.save') }}
            </UiButton>
          </UiFormWrapper>
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
