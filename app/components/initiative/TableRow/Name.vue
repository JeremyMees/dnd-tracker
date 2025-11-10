<script setup lang="ts">
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import * as z from 'zod'

const props = defineProps<{ item: InitiativeSheetRow }>()

const { sheet, update } = validateInject(INITIATIVE_SHEET)

const popoverOpen = shallowRef<boolean>(false)
const formError = ref<string>('')

const formSchema = toTypedSchema(z.object({
  name: z.string().min(2).max(30),
}))

const form = useForm({
  validationSchema: formSchema,
})

const onSubmit = form.handleSubmit(async (values) => {
  formError.value = ''

  try {
    if (!sheet.value) return

    const index = getCurrentRowIndex(sheet.value, props.item.id)
    const rows = [...sheet.value.rows]

    if (index === -1 || !rows[index]) return

    rows[index] = {
      ...rows[index],
      name: values.name,
    }

    await update({ rows })
    popoverOpen.value = false
  }
  catch (err: any) {
    formError.value = err.message || 'An error occurred during name update'
  }
})
</script>

<template>
  <UiPopover v-model:open="popoverOpen">
    <UiPopoverTrigger as-child>
      <button class="flex items-center gap-x-2">
        <Icon
          v-tippy="$t(`general.${item.type}`)"
          :name="homebrewIcon(item.type)"
          :class="homebrewColor(item.type)"
          class="size-5 min-w-5"
          aria-hidden="true"
        />
        <div class="flex flex-col gap-y-1 text-left">
          <span data-test-name>
            {{ item.name }}
          </span>
          <span
            v-if="item.summoner?.name"
            data-test-summoner
            class="text-2xs text-muted-foreground"
          >
            {{ $t('general.summoner') }}: {{ item.summoner.name }}
          </span>
        </div>
      </button>
    </UiPopoverTrigger>
    <UiPopoverContent>
      <UiPopoverHeader>
        <UiPopoverTitle>
          {{ $t('components.initiativeTableModals.name') }}
        </UiPopoverTitle>
      </UiPopoverHeader>
      <UiFormWrapper @submit="onSubmit">
        <UiFormField
          v-slot="{ componentField }"
          name="name"
        >
          <UiFormItem v-auto-animate>
            <UiFormControl>
              <UiInputGroup>
                <UiInputGroupInput
                  type="text"
                  v-bind="componentField"
                />
                <UiInputGroupAddon align="inline-end">
                  <UiInputGroupButton
                    :aria-label="$t('actions.save')"
                    type="submit"
                  >
                    <Icon name="tabler:device-floppy" />
                  </UiInputGroupButton>
                </UiInputGroupAddon>
              </UiInputGroup>
            </UiFormControl>
            <UiFormMessage />
          </UiFormItem>
        </UiFormField>
        <div
          v-if="formError"
          class="text-sm text-destructive"
        >
          {{ formError }}
        </div>
      </UiFormWrapper>
    </UiPopoverContent>
  </UiPopover>
</template>
