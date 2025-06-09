<script setup lang="ts">
import { reset } from '@formkit/core'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'

const props = defineProps<{ item: InitiativeSheetRow }>()

const { sheet, update } = validateInject(INITIATIVE_SHEET)

const { t } = useI18n()

const popoverOpen = ref<boolean>(false)

const currentIndex = computed(() => props.item.index)

const canGoUp = computed(() => {
  if (!sheet.value) return false

  const isNotFirst = currentIndex.value > 0
  const isSameInitiative = sheet.value.rows[currentIndex.value - 1]?.initiative === props.item.initiative

  return isNotFirst && isSameInitiative
})

const canGoDown = computed(() => {
  if (!sheet.value) return false

  const isNotLast = currentIndex.value < sheet.value.rows.length - 1
  const isSameInitiative = sheet.value.rows[currentIndex.value + 1]?.initiative === props.item.initiative

  return isNotLast && isSameInitiative
})

async function moveRow(up: boolean): Promise<void> {
  if (!sheet.value) return

  const rows = [...sheet.value.rows]
  const index = props.item.index
  const targetIndex = up ? index - 1 : index + 1

  if (
    (up && index <= 0)
    || (!up && index >= rows.length - 1)
    || !rows[index]
    || !rows[targetIndex]
  ) return

  // Just change the index properties without swapping the array positions
  rows[index] = { ...rows[index], index: targetIndex }
  rows[targetIndex] = { ...rows[targetIndex], index: index }

  // When moving up, update all following indexes to maintain sequence
  if (up) {
    for (let i = index + 1; i < rows.length; i++) {
      if (rows[i]) rows[i] = { ...rows[i], index: i } as InitiativeSheetRow
    }
  }

  await update({ rows: [...rows].sort((a, b) => a.index - b.index) })
}

interface InitiativeForm { initiative: number, modifier?: number }

async function handleSubmit(form: InitiativeForm, node: FormNode): Promise<void> {
  node.clearErrors()

  try {
    if (!sheet.value) return

    const { initiative, modifier } = sanitizeForm<InitiativeForm>(form)

    const index = getCurrentRowIndex(sheet.value, props.item.id)
    const rows = [...sheet.value.rows]

    if (index === -1 || !rows[index]) return

    rows[index] = {
      ...rows[index],
      initiative: Math.max(0, initiative + (modifier ?? 0)),
    }

    await update({ rows })
    popoverOpen.value = false
  }
  catch (err: any) {
    reset('InitiativeRowInit')
    node.setErrors(t('general.error.text'))
  }
}
</script>

<template>
  <div class="flex gap-2 items-center text-left">
    <UiPopover v-model:open="popoverOpen">
      <UiPopoverTrigger as-child>
        <button
          data-test-trigger
          class="flex flex-col justify-center"
        >
          <Icon
            v-if="item.initiative < 0"
            data-test-empty
            name="tabler:plus"
            class="size-5 min-w-5 text-foreground/10"
            aria-hidden="true"
          />
          <span
            v-else
            data-test-initiative
          >
            {{ item.initiative }}
          </span>
        </button>
      </UiPopoverTrigger>
      <UiPopoverContent>
        <UiPopoverHeader>
          <UiPopoverTitle>
            {{ $t('components.initiativeTableModals.init') }}
          </UiPopoverTitle>
        </UiPopoverHeader>
        <FormKit
          id="InitiativeRowInit"
          type="form"
          :submit-label="$t('actions.save')"
          @submit="handleSubmit"
        >
          <FormKit
            name="initiative"
            :label="$t('components.inputs.amountLabel')"
            :value="item.initiative < 0 ? undefined : item.initiative"
            validation="required|between:0,50|number"
            type="number"
            suffix-icon="tabler:hexagon"
            number
            @suffix-icon-click="(node: FormNode) => node.input(randomRoll(20))"
          />
          <FormKit
            name="modifier"
            :label="`${$t('components.inputs.initiativeLabel')} (MODIFIER)`"
            :value="item.initiative_modifier"
            validation="between:-20,20|number"
            min="-20"
            max="20"
            type="number"
            number
          />
        </FormKit>
      </UiPopoverContent>
    </UiPopover>
    <div
      v-if="item.initiative !== null && item.initiative >= 0"
      data-test-controls
      class="flex flex-col"
    >
      <button
        v-if="canGoUp"
        v-tippy="$t('actions.moveUp')"
        data-test-up
        :aria-label="$t('actions.moveUp')"
        :class="{ 'relative top-1': canGoDown }"
        class="flex items-center"
        @click="moveRow(true)"
      >
        <Icon
          name="tabler:caret-up"
          class="size-5 min-w-5 text-tertiary"
          aria-hidden="true"
        />
      </button>
      <button
        v-if="canGoDown"
        v-tippy="$t('actions.moveDown')"
        data-test-down
        :aria-label="$t('actions.moveDown')"
        :class="{ 'relative bottom-1': canGoUp }"
        class="flex items-center"
        @click="moveRow(false)"
      >
        <Icon
          name="tabler:caret-down"
          class="size-5 min-w-5 text-tertiary"
          aria-hidden="true"
        />
      </button>
    </div>
  </div>
</template>
