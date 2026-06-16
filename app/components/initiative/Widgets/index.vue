<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { initiativeWidgets, widgetLabels } from '~~/constants/validation'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import * as z from 'zod'

const { sheet, update } = validateInject(INITIATIVE_SHEET)

const definitions = initiativeWidgets.map(id => ({ id }))

const formSchema = toTypedSchema(z.object({
  widgets: z.array(z.enum(initiativeWidgets)),
}))

const form = useForm({ validationSchema: formSchema })
const formError = ref<string>('')
const popoverOpen = shallowRef(false)
const localWidgets = ref<InitiativeWidget[]>([])
const isModified = computed(() => sheet.value?.settings?.modified ?? false)

watch(
  () => sheet.value?.settings,
  (settings) => {
    localWidgets.value = settings?.modified ? [...(settings.widgets ?? [])] : [...initiativeWidgets]
  },
  { immediate: true },
)

watch(popoverOpen, (open) => {
  if (!open) return

  form.setValues({
    widgets: isModified.value ? (sheet.value?.settings?.widgets ?? []) : [...initiativeWidgets],
  })
})

const onSubmit = form.handleSubmit(async (values) => {
  if (!sheet.value) return
  formError.value = ''

  await update({
    settings: {
      ...sheet.value.settings,
      ...values,
      modified: true,
    },
  })

  popoverOpen.value = false
})

function saveWidgets(widgets: InitiativeWidget[]) {
  if (!sheet.value) return
  update({
    settings: {
      ...sheet.value.settings,
      widgets,
      modified: true,
    },
  })
}

function onDragEnd() {
  saveWidgets(localWidgets.value)
}

function removeWidget(id: InitiativeWidget) {
  const updated = localWidgets.value.filter(w => w !== id)
  localWidgets.value = updated
  saveWidgets(updated)
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
              :options="definitions.map(d => ({ label: $t(widgetLabels[d.id]), value: d.id }))"
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

    <VueDraggable
      v-if="localWidgets.length"
      v-model="localWidgets"
      handle=".drag-handle"
      :animation="150"
      class="grid xl:grid-cols-2 gap-2 items-start"
      @end="onDragEnd"
    >
      <div
        v-for="widget in localWidgets"
        :key="widget"
        class="flex flex-col gap-1"
      >
        <DragAndDropHeader :title="$t(widgetLabels[widget])">
          <UiButton
            variant="destructive-ghost"
            size="icon-sm"
            :aria-label="$t('actions.remove')"
            @click="removeWidget(widget)"
          >
            <Icon name="tabler:x" />
          </UiButton>
        </DragAndDropHeader>

        <LazyInitiativeWidgetsNote
          v-if="widget === 'note'"
          hydrate-on-idle
          :value="sheet?.info ?? ''"
          @update="update({ info: $event })"
        />
        <LazyInitiativeWidgetsPinnedContent
          v-if="widget === 'info-pins'"
          hydrate-on-idle
          :value="sheet?.infoCards ?? []"
          @update="update({ infoCards: $event })"
        />
        <LazyInitiativeWidgetsFantasyNameGenerator
          v-if="widget === 'fantasy-name-generator'"
          hydrate-on-idle
        />
      </div>
    </VueDraggable>

    <p
      v-else
      class="text-muted-foreground text-sm"
    >
      {{ $t('components.initiativeSettings.noActiveWidgets') }}
    </p>
  </div>
</template>
