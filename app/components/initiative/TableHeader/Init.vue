<script setup lang="ts">
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import * as z from 'zod'

defineProps<{ label: string }>()

const { sheet, update } = validateInject(INITIATIVE_SHEET)

const popoverOpen = shallowRef(false)
const formError = ref<string>('')

const usedTypes = computed(() => [...new Set(sheet.value?.rows.map(({ type }) => type))])

const formSchema = toTypedSchema(z.object({
  selectedTypes: z.array(z.string()),
  ignore: z.boolean(),
  selectedCreatures: z.array(z.object({
    id: z.string(),
    amount: z.number().min(0).max(50).optional(),
    initiative: z.number().min(-20).max(20).optional(),
  })),
}))

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    selectedTypes: [],
    ignore: false,
    selectedCreatures: [],
  },
})

watch(popoverOpen, (open) => {
  if (!open) return

  form.setValues({
    selectedTypes: usedTypes.value,
    ignore: false,
    selectedCreatures: sheet.value?.rows.map(row => ({
      id: row.id,
      amount: isDefined(row.initiative) && row.initiative > -1
        ? row.initiative
        : undefined,
      initiative: row.initiative_modifier,
    })) ?? [],
  })
})

function rollAllInitiatives() {
  const selected = form.values.selectedTypes ?? []

  sheet.value?.rows.forEach(({ type }, index) => {
    if (selected.includes(type)) {
      form.setFieldValue(
        `selectedCreatures[${index}].amount`,
        randomRoll(20) as never,
      )
    }
  })
}

const onSubmit = form.handleSubmit(async (values) => {
  formError.value = ''

  try {
    if (!sheet.value) return

    const { ignore, selectedCreatures } = values

    const rows = [...sheet.value.rows]

    selectedCreatures.forEach(({ id, amount, initiative }) => {
      if (amount !== undefined) {
        const index = rows.findIndex(row => row.id === id)

        if (index >= 0) {
          let init = amount

          if (
            !ignore
            && isDefined(initiative)
            && !isNaN(initiative)
          ) init += initiative

          if (rows[index]) rows[index] = { ...rows[index], initiative: Math.max(init, 0) }
        }
      }
    })

    await update({ rows })
    popoverOpen.value = false
  }
  catch (err: any) {
    formError.value = err.message || 'An error occurred during quick initiative roll'
  }
})
</script>

<template>
  <div>
    <UiPopover v-model:open="popoverOpen">
      <UiPopoverTrigger as-child>
        <button
          id="tour-10"
          class="flex items-center gap-x-1 w-fit rounded-lg hover:bg-warning/50 hover:text-foreground hover:-mx-2 hover:-my-1 hover:px-2 hover:py-1 transition-all duration-300"
        >
          {{ label }}
          <Icon
            name="tabler:bolt-filled"
            class="text-warning"
          />
        </button>
      </UiPopoverTrigger>
      <UiPopoverContent class="max-w-[800px] max-h-[600px]">
        <UiPopoverHeader>
          <UiPopoverTitle>
            {{ $t('components.initiativeTableHeader.initiative.title') }}
          </UiPopoverTitle>
        </UiPopoverHeader>
        <UiFormWrapper @submit="onSubmit">
          <div class="grid md:grid-cols-2 gap-4">
            <div
              v-for="(row, index) in sheet?.rows || []"
              :key="row.id"
              class="flex gap-2"
            >
              <UiFormField
                v-slot="{ componentField, setValue }"
                :name="`selectedCreatures.${index}.amount`"
              >
                <UiFormItem
                  v-auto-animate
                  class="w-30"
                >
                  <UiFormLabel
                    :for="row.id"
                    class="text-ellipsis line-clamp-1"
                  >
                    {{ row.name }}
                  </UiFormLabel>
                  <UiFormControl>
                    <UiInputGroup>
                      <UiInputGroupInput
                        :id="row.id"
                        type="number"
                        v-bind="componentField"
                      />
                      <UiInputGroupAddon align="inline-end">
                        <UiInputGroupButton
                          :aria-label="$t('actions.roll')"
                          type="button"
                          @click="setValue(randomRoll(20))"
                        >
                          <Icon name="tabler:hexagon" />
                        </UiInputGroupButton>
                      </UiInputGroupAddon>
                    </UiInputGroup>
                  </UiFormControl>
                  <UiFormMessage />
                </UiFormItem>
              </UiFormField>
              <UiFormField
                v-slot="{ componentField }"
                :name="`selectedCreatures.${index}.initiative`"
              >
                <UiFormItem
                  v-auto-animate
                  class="w-20"
                >
                  <UiFormLabel
                    :for="`${row.id}-mod`"
                    class="text-ellipsis line-clamp-1"
                  >
                    MOD
                  </UiFormLabel>
                  <UiFormControl>
                    <UiInput
                      :id="`${row.id}-mod`"
                      type="number"
                      v-bind="componentField"
                    />
                  </UiFormControl>
                  <UiFormMessage />
                </UiFormItem>
              </UiFormField>
            </div>
          </div>

          <FormCheckboxGroup
            name="selectedTypes"
            :label="$t('components.initiativeTableHeader.initiative.select')"
            :options="usedTypes.map((type) => ({
              label: $t(`general.${type}`),
              value: type,
            }))"
            list-class="sm:grid-cols-2 rounded-md border border-input bg-background px-3 py-2"
          />

          <div
            v-if="formError"
            class="text-sm text-destructive"
          >
            {{ formError }}
          </div>

          <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
            <UiFormField
              v-slot="{ value, handleChange }"
              name="ignore"
            >
              <UiFormItem
                v-auto-animate
                class="flex items-center gap-2"
              >
                <UiFormControl>
                  <UiSwitch
                    class="mb-0"
                    :model-value="value"
                    @update:model-value="handleChange"
                  />
                </UiFormControl>
                <UiFormLabel>
                  {{ $t('components.initiativeTableHeader.initiative.ignore') }}
                </UiFormLabel>
              </UiFormItem>
            </UiFormField>
            <UiButton
              type="button"
              variant="foreground"
              :disabled="!(form.values.selectedTypes ?? []).length"
              :aria-label="$t('components.initiativeTableHeader.initiative.roll')"
              @click="rollAllInitiatives"
            >
              {{ $t('components.initiativeTableHeader.initiative.roll') }}
            </UiButton>
            <UiButton
              type="submit"
              :aria-label="$t('actions.update')"
            >
              {{ $t('actions.update') }}
            </UiButton>
          </div>
        </UiFormWrapper>
      </UiPopoverContent>
    </UiPopover>
  </div>
</template>
