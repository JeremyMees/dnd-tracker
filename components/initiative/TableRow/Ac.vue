<script setup lang="ts">
import { reset } from '@formkit/core'
import { acFunctions } from '~/utils/dnd-helpers'

const props = defineProps<{
  item: InitiativeSheetRow
  sheet: InitiativeSheet | undefined
  update: (payload: Omit<Partial<InitiativeSheet>, NotUpdatable | 'campaign'>) => Promise<void>
}>()

const { t } = useI18n()

const { add, remove, temp, override, overrideReset } = acFunctions

const popoverOpen = ref<boolean>(false)

type AcType = 'add' | 'remove' | 'temp' | 'override' | 'override-reset'
interface AcForm { amount: number }

async function updateRow(row: Partial<InitiativeSheetRow>): Promise<void> {
  if (!props.sheet) return

  const index = getCurrentRowIndex(props.sheet, props.item.id)
  const rows = [...props.sheet.rows]

  if (index === -1) return

  rows[index] = { ...rows[index], ...row }

  await props.update({ rows })
  popoverOpen.value = false
}

async function updateOverride(form: AcForm & { reset?: boolean }, node: FormNode): Promise<void> {
  node.clearErrors()

  try {
    if (!props.sheet) return

    const { amount, reset } = sanitizeForm<AcForm & { reset?: boolean }>(form)

    const row = reset || amount === props.item.maxAcOld
      ? handleAcChanges(props.item.maxAcOld ?? 0, 'override-reset')
      : handleAcChanges(amount, 'override')

    await updateRow(row)
  }
  catch {
    reset('InitiativeRowAcOverride')
    node.setErrors(t('general.error.text'))
  }
}

async function updateAc(form: AcForm & { type?: AcType }, node: FormNode): Promise<void> {
  node.clearErrors()

  try {
    if (!props.sheet || !form.type) return

    const { amount, type } = sanitizeForm<AcForm & { type?: AcType }>(form)

    const row = handleAcChanges(amount, type || 'remove')

    await updateRow(row)
  }
  catch {
    reset('InitiativeRowAcUpdate')
    node.setErrors(t('general.error.text'))
  }
}

function handleAcChanges(amount: number, type: AcType): InitiativeSheetRow {
  const row = { ...props.item }

  if (type === 'add') add(row, amount)
  else if (type === 'remove') remove(row, amount)
  else if (type === 'temp') temp(row, amount)
  else if (type === 'override') override(row, amount)
  else if (type === 'override-reset') overrideReset(row, amount)

  // when ac is an negative number change it to 0
  if (row.ac && row.ac < 0) row.ac = 0

  return row
}
</script>

<template>
  <div>
    <UiPopover v-model:open="popoverOpen">
      <UiPopoverTrigger as-child>
        <button
          :class="{
            'bg-destructive/20 p-2 rounded-lg w-fit': item.ac !== null && item.ac === 0,
          }"
          class="flex flex-col gap-y-1"
        >
          <div class="flex items-center gap-x-1">
            <Icon
              v-if="item.ac === null"
              name="tabler:plus"
              class="size-5 min-w-5 text-foreground/10"
              aria-hidden="true"
            />
            <span
              v-else
              :class="{ 'text-destructive': item.ac === 0 }"
            >
              {{ item.ac }}
            </span>
            <span
              v-if="item.ac !== null && item.tempAc"
              v-tippy="$t('general.temp')"
              class="text-warning text-xs"
            >
              +{{ item.tempAc }}
            </span>
          </div>
          <span
            v-if="item.maxAc !== item.ac"
            class="body-extra-small text-muted-foreground whitespace-nowrap"
          >
            {{ $t('general.max') }}: {{ item.maxAc }}
          </span>
        </button>
      </UiPopoverTrigger>
      <UiPopoverContent>
        <div
          v-if="item?.ac !== undefined && item?.maxAc !== undefined"
          class="flex flex-wrap gap-x-1 gap-y-2 pb-6 items-start justify-center"
        >
          <div class="p-2 rounded-lg space-y-4 min-w-[75px] bg-background text-center flex-1">
            <p class="font-bold text-muted-foreground text-xs">
              {{ $t('general.current') }}
            </p>
            <p
              class="head-2"
              :class="{ 'text-destructive': item.ac < 1 }"
            >
              {{ item.ac || 0 }}
            </p>
          </div>
          <div class="p-2 rounded-lg space-y-4 min-w-[75px] bg-background text-center flex-1">
            <p class="font-bold text-muted-foreground text-xs">
              {{ $t('general.max') }}
            </p>
            <div class="flex gap-1 items-start justify-center">
              <p
                class="head-2"
                :class="[!item.maxAcOld ? undefined : item.maxAcOld < item.maxAc ? 'text-success' : 'text-destructive']"
              >
                {{ item.maxAc || 0 }}
              </p>
              <p
                v-if="item.maxHealthOld === 0 || item.maxHealthOld"
                class="body-small"
              >
                ({{ item.maxAcOld }})
              </p>
            </div>
          </div>
          <div class="p-2 rounded-lg space-y-4 min-w-[75px] bg-background text-center flex-1">
            <p class="font-bold text-muted-foreground text-xs">
              {{ $t('general.temp') }}
            </p>
            <p class="head-2">
              {{ item.tempAc || 0 }}
            </p>
          </div>
        </div>
        <FormKit
          id="InitiativeRowAcUpdate"
          type="form"
          :submit-label="$t('actions.save')"
          @submit="updateAc"
        >
          <FormDiceRollInput />
          <FormKit
            type="togglebuttons"
            name="type"
            value="remove"
            enforced
            :options="[
              { label: $t('actions.heal'), value: 'add', icon: 'tabler:heart' },
              { label: $t('actions.temp'), value: 'temp', icon: 'tabler:plus' },
              { label: $t('actions.damage'), value: 'remove', icon: 'tabler:sword' },
            ]"
            validation="required"
            input-class="$remove:p-2 $remove:border-4 $remove:aria-pressed:border-primary $remove:focus-within:border-primary group"
            option-class="$remove:w-10 $remove:h-10"
          >
            <template #default="{ option }">
              <div
                class="flex items-center gap-x-1 rounded-lg p-2 border-2 border-transparent"
                :class="{
                  'bg-destructive/20 group-aria-pressed:bg-destructive/40 group-aria-pressed:border-destructive': option.value === 'remove',
                  'bg-success/20 group-aria-pressed:bg-success/40 group-aria-pressed:border-success': option.value === 'add',
                  'bg-warning/20 group-aria-pressed:bg-warning/40 group-aria-pressed:border-warning': option.value === 'temp',
                }"
              >
                <Icon
                  :name="option.icon"
                  class="size-4 min-w-4 text-foreground"
                  aria-hidden="true"
                />
                <span class="text-xs text-muted-foreground group-aria-pressed:!text-foreground">
                  {{ option.label }}
                </span>
              </div>
            </template>
          </FormKit>
        </FormKit>
        <UiSeparator class="my-6 bg-muted-foreground" />
        <FormKit
          id="InitiativeRowAcOverride"
          type="form"
          :submit-label="$t('actions.save')"
          @submit="updateOverride"
        >
          <FormKit
            type="number"
            name="amount"
            number
            :label="$t('components.inputs.overrideFieldLabel', { field: 'AC' })"
            :help="$t('components.inputs.optionalFieldHelp', { field: 'AC' })"
            validation="required|between:1,100|number"
            :suffix-icon="item.maxAcOld ? 'tabler:player-skip-back' : undefined"
            @suffix-icon-click="(node: FormNode) => updateOverride({ reset: true, amount: item.maxAcOld || 0 }, node)"
          />
        </FormKit>
      </UiPopoverContent>
    </UiPopover>
  </div>
</template>
