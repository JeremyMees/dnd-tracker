<script setup lang="ts">
import { reset } from '@formkit/core'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'

const props = defineProps<{ item: InitiativeSheetRow }>()

const { sheet, update } = validateInject(INITIATIVE_SHEET)

const { t } = useI18n()

const popoverOpen = ref<boolean>(false)

interface NameForm { name: string }

async function handleSubmit(form: NameForm, node: FormNode): Promise<void> {
  node.clearErrors()

  try {
    if (!sheet.value) return

    const { name } = sanitizeForm<NameForm>(form)

    const index = getCurrentRowIndex(sheet.value, props.item.id)
    const rows = [...sheet.value.rows]

    if (index === -1 || !rows[index]) return

    rows[index] = {
      ...rows[index],
      name,
    }

    await update({ rows })
    popoverOpen.value = false
  }
  catch (err: any) {
    reset('InitiativeRowName')
    node.setErrors(t('general.error.text'))
  }
}
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
      <FormKit
        id="InitiativeRowName"
        type="form"
        :submit-label="$t('actions.save')"
        @submit="handleSubmit"
      >
        <FormKit
          name="name"
          :label="$t('components.inputs.nameLabel')"
          :value="item.name"
        />
      </FormKit>
    </UiPopoverContent>
  </UiPopover>
</template>
