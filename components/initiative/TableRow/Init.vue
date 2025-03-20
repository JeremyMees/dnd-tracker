<script setup lang="ts">
import { reset } from '@formkit/core'

const props = defineProps<{
  item: InitiativeSheetRow
  sheet: InitiativeSheet | undefined
  update: (payload: Omit<Partial<InitiativeSheet>, NotUpdatable | 'campaign'>) => Promise<void>
}>()

const { t } = useI18n()

const popoverOpen = ref<boolean>(false)

const currentIndex = computed(() => props.item.index)
const canGoUp = computed(() => {
  if (!props.sheet) return false
  return currentIndex.value > 0 && props.sheet.rows[currentIndex.value - 1]?.initiative === props.item.initiative
})
const canGoDown = computed(() => {
  if (!props.sheet) return false
  return currentIndex.value < props.sheet.rows.length - 1 && props.sheet.rows[currentIndex.value + 1]?.initiative === props.item.initiative
})

async function moveRow(up: boolean): Promise<void> {
  if (!props.sheet) return

  const rows = [...props.sheet.rows]
  const index = props.item.index
  const targetIndex = up ? index - 1 : index + 1

  if (up && index <= 0) return
  if (!up && index >= rows.length - 1) return

  // Just change the index properties without swapping the array positions
  rows[index] = { ...rows[index], index: targetIndex }
  rows[targetIndex] = { ...rows[targetIndex], index: index }

  // When moving up, update all following indexes to maintain sequence
  if (up) {
    for (let i = index + 1; i < rows.length; i++) {
      rows[i] = { ...rows[i], index: i }
    }
  }

  await props.update({ rows: [...rows].sort((a, b) => a.index - b.index) })
}

interface InitiativeForm { initiative: number, modifier?: number }

async function handleSubmit(form: InitiativeForm, node: FormNode): Promise<void> {
  node.clearErrors()

  try {
    if (!props.sheet) return

    const { initiative, modifier } = sanitizeForm<InitiativeForm>(form)

    const index = getCurrentRowIndex(props.sheet, props.item.id)
    const rows = [...props.sheet.rows]

    if (index === -1) return

    rows[index] = {
      ...rows[index],
      initiative: Math.max(0, initiative + (modifier ?? 0)),
    }

    await props.update({ rows })
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
        <button class="flex flex-col justify-center">
          <Icon
            v-if="item.initiative < 0"
            name="tabler:plus"
            class="size-5 min-w-5 text-foreground/10"
            aria-hidden="true"
          />
          <span v-else>{{ item.initiative }}</span>
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
      class="flex flex-col"
    >
      <button
        v-if="canGoUp"
        v-tippy="$t('actions.moveUp')"
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
