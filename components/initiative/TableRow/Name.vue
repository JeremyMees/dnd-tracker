<script setup lang="ts">
import { reset } from '@formkit/core'

const props = defineProps<{
  item: InitiativeSheetRow
  sheet: InitiativeSheet | undefined
  update: (payload: Omit<Partial<InitiativeSheet>, NotUpdatable | 'campaign'>) => Promise<void>
}>()

const { t } = useI18n()

const popoverOpen = ref<boolean>(false)

interface NameForm { name: string }

async function handleSubmit(form: NameForm, node: FormNode): Promise<void> {
  node.clearErrors()

  try {
    if (!props.sheet) return

    const { name } = sanitizeForm<NameForm>(form)

    const index = getCurrentRowIndex(props.sheet, props.item.id)
    const rows = [...props.sheet.rows]

    if (index === -1) return

    rows[index] = {
      ...rows[index],
      name,
    }

    await props.update({ rows })
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
          <span>
            {{ item.name }}
          </span>
          <span
            v-if="item.summoner?.name"
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
