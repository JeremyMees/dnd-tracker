<script setup lang="ts">
import { useForm } from 'vee-validate'
import * as z from 'zod'
import { abilityTypeMap } from '~~/constants/dnd'
import { abilityType } from '~~/constants/validation'

const props = defineProps<{
  item: Pick<InitiativeSheetRow, 'id' | 'name'>
  condition: DndCondition
  rows: Pick<InitiativeSheetRow, 'id' | 'name'>[]
  activeRowId?: string
  allowNone?: boolean
}>()

const emit = defineEmits<{
  update: [duration: DndConditionDuration | null]
}>()

const { t } = useI18n()

const showCustom = shallowRef(false)

const presets: DndConditionPreset[] = [
  'endOfNextTurn',
  'startOfNextTurn',
  'oneMinute',
]

const activeName = computed(
  () =>
    props.rows.find(row => row.id === props.activeRowId)?.name ??
    props.item.name,
)

const abilityOptions = Object.entries(abilityTypeMap).map(([label, value]) => ({
  label,
  value,
}))

const formSchema = z
  .object({
    rowId: z.string().min(1),
    timing: z.enum(['start', 'end']),
    rounds: z.int().min(1).max(100).optional(),
    ability: z.enum(abilityType).optional(),
    dc: z.int().min(1).max(30).optional(),
  })
  .refine(values => !!values.rounds || !!values.ability, {
    error: () => t('components.conditionDuration.required'),
    path: ['rounds'],
  })
  .refine(values => !values.ability || !!values.dc, {
    error: () => t('zod.required'),
    path: ['dc'],
  })

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    rowId: props.condition.duration?.rowId ?? props.item.id,
    timing: props.condition.duration?.timing ?? 'end',
    rounds: props.condition.duration?.rounds ?? undefined,
    ability: props.condition.duration?.save?.ability,
    dc: props.condition.duration?.save?.dc,
  },
})

const onSubmit = form.handleSubmit(values => {
  emit('update', {
    rowId: values.rowId,
    timing: values.timing,
    ...(values.rounds && { rounds: values.rounds }),
    ...(values.ability &&
      values.dc && { save: { ability: values.ability, dc: values.dc } }),
  })
})

function applyPreset(preset: DndConditionPreset): void {
  emit(
    'update',
    conditionDurationPreset(preset, {
      rowId: props.item.id,
      activeRowId: props.activeRowId,
    }),
  )
}
</script>

<template>
  <div class="flex flex-col gap-y-4">
    <div class="flex flex-wrap gap-2">
      <UiButton
        v-if="allowNone"
        test-id="none"
        type="button"
        size="sm"
        variant="foreground"
        class="border-2"
        @click="emit('update', null)"
      >
        {{ $t('components.conditionDuration.clear') }}
      </UiButton>
      <UiButton
        v-for="preset in presets"
        :key="preset"
        :test-id="`preset-${preset}`"
        type="button"
        size="sm"
        variant="foreground"
        class="border-2"
        @click="applyPreset(preset)"
      >
        {{
          $t(`components.conditionDuration.presets.${preset}`, {
            name: activeName,
          })
        }}
      </UiButton>
      <UiButton
        v-if="!allowNone && condition.duration"
        test-id="clear"
        type="button"
        size="sm"
        variant="foreground"
        class="border-2"
        @click="emit('update', null)"
      >
        {{ $t('components.conditionDuration.clear') }}
      </UiButton>
    </div>

    <UiButton
      test-id="custom"
      type="button"
      variant="secondary"
      class="w-full justify-between"
      :aria-expanded="showCustom"
      @click="showCustom = !showCustom"
    >
      {{ $t('components.conditionDuration.custom') }}
      <Icon
        name="tabler:chevron-down"
        class="transition-transform duration-200"
        :class="{ 'rotate-180': showCustom }"
        aria-hidden="true"
      />
    </UiButton>

    <AnimationExpand>
      <UiFormWrapper
        v-show="showCustom"
        test-id="custom-form"
        @submit="onSubmit"
      >
        <div class="grid grid-cols-2 gap-2">
          <UiFormField v-slot="{ componentField }" name="rounds">
            <UiFormItem>
              <UiFormLabel>
                {{ $t('components.conditionDuration.rounds') }}
              </UiFormLabel>
              <UiFormControl>
                <UiInput
                  type="number"
                  test-id="rounds"
                  v-bind="componentField"
                />
              </UiFormControl>
              <UiFormMessage />
            </UiFormItem>
          </UiFormField>

          <UiFormField v-slot="{ componentField }" name="timing">
            <UiFormItem>
              <UiFormLabel>
                {{ $t('components.conditionDuration.timing') }}
              </UiFormLabel>
              <UiSelect v-bind="componentField">
                <UiFormControl>
                  <UiSelectTrigger test-id="timing">
                    <UiSelectValue />
                  </UiSelectTrigger>
                </UiFormControl>
                <UiSelectContent>
                  <UiSelectGroup>
                    <UiSelectItem
                      v-for="timing in ['start', 'end']"
                      :key="timing"
                      :value="timing"
                    >
                      {{ $t(`components.conditionDuration.timings.${timing}`) }}
                    </UiSelectItem>
                  </UiSelectGroup>
                </UiSelectContent>
              </UiSelect>
              <UiFormMessage />
            </UiFormItem>
          </UiFormField>
        </div>

        <UiFormField v-slot="{ componentField }" name="rowId">
          <UiFormItem>
            <UiFormLabel>
              {{ $t('components.conditionDuration.row') }}
            </UiFormLabel>
            <UiSelect v-bind="componentField">
              <UiFormControl>
                <UiSelectTrigger test-id="row">
                  <UiSelectValue />
                </UiSelectTrigger>
              </UiFormControl>
              <UiSelectContent>
                <UiSelectGroup>
                  <UiSelectItem
                    v-for="row in rows"
                    :key="row.id"
                    :value="row.id"
                  >
                    {{ row.name }}
                  </UiSelectItem>
                </UiSelectGroup>
              </UiSelectContent>
            </UiSelect>
            <UiFormMessage />
          </UiFormItem>
        </UiFormField>

        <div class="grid grid-cols-2 gap-2">
          <UiFormField v-slot="{ value, handleChange }" name="ability">
            <UiFormItem>
              <UiFormLabel>
                {{ $t('components.conditionDuration.save') }}
              </UiFormLabel>
              <UiSelect
                :model-value="value ?? 'none'"
                @update:model-value="
                  v => handleChange(v === 'none' ? undefined : v)
                "
              >
                <UiFormControl>
                  <UiSelectTrigger test-id="ability">
                    <UiSelectValue />
                  </UiSelectTrigger>
                </UiFormControl>
                <UiSelectContent>
                  <UiSelectGroup>
                    <UiSelectItem value="none">
                      {{ $t('components.inputs.nothing') }}
                    </UiSelectItem>
                    <UiSelectItem
                      v-for="option in abilityOptions"
                      :key="option.value"
                      :value="option.value"
                    >
                      {{ option.label }}
                    </UiSelectItem>
                  </UiSelectGroup>
                </UiSelectContent>
              </UiSelect>
              <UiFormMessage />
            </UiFormItem>
          </UiFormField>

          <UiFormField v-slot="{ componentField }" name="dc">
            <UiFormItem>
              <UiFormLabel>DC</UiFormLabel>
              <UiFormControl>
                <UiInput type="number" test-id="dc" v-bind="componentField" />
              </UiFormControl>
              <UiFormMessage />
            </UiFormItem>
          </UiFormField>
        </div>

        <div class="flex justify-end gap-2">
          <UiButton test-id="submit" type="submit" variant="foreground">
            {{ $t('components.conditionDuration.set') }}
          </UiButton>
        </div>
      </UiFormWrapper>
    </AnimationExpand>
  </div>
</template>
