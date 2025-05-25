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

const popoverOpen = shallowRef<boolean>(false)
const selectedType = shallowRef<AcType>('remove')

const hasAc = computed(() => isDefined(props.item.ac) && isDefined(props.item.maxAc))

type AcType = 'add' | 'remove' | 'temp' | 'override' | 'override-reset'
interface AcForm { amount: number }

async function updateRow(row: Partial<InitiativeSheetRow>): Promise<void> {
  if (!props.sheet) return

  const index = getCurrentRowIndex(props.sheet, props.item.id)
  const rows = [...props.sheet.rows]

  if (index === -1 || !rows[index]) return

  rows[index] = { ...rows[index], ...row }

  await props.update({ rows })
  popoverOpen.value = false
}

async function updateBase(form: AcForm, node: FormNode): Promise<void> {
  node.clearErrors()

  try {
    if (!props.sheet) return

    const { amount } = sanitizeForm<AcForm>(form)
    const row = {
      ...props.item,
      maxAc: amount,
      maxAcOld: undefined,
      ac: amount,
    }

    await updateRow(row)
  }
  catch {
    reset('InitiativeRowAcBase')
    node.setErrors(t('general.error.text'))
  }
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

async function updateAc(form: AcForm, node: FormNode): Promise<void> {
  node.clearErrors()

  try {
    const selected = selectedType.value

    if (!props.sheet || !selected) return

    const { amount, type } = sanitizeForm<AcForm & { type?: AcType }>({ ...form, type: selected })

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
  const resetNegative = props.sheet?.settings?.negative === false
  if (resetNegative && row.ac && row.ac < 0) row.ac = 0

  return row
}
</script>

<template>
  <div>
    <UiPopover v-model:open="popoverOpen">
      <UiPopoverTrigger as-child>
        <button
          data-test-trigger
          :class="{
            'bg-destructive/20 p-2 rounded-lg w-fit': isDefined(item.ac) && item.ac <= 0,
          }"
          class="flex flex-col gap-y-1"
        >
          <div class="flex items-center gap-x-1">
            <Icon
              v-if="!isDefined(item.ac) && item.type !== 'lair'"
              data-test-empty
              name="tabler:plus"
              class="size-5 min-w-5 text-foreground/10"
              aria-hidden="true"
            />
            <span
              v-else
              data-test-ac
              :class="{ 'text-destructive': isDefined(item.ac) && item.ac <= 0 }"
            >
              {{ item.ac }}
            </span>
            <span
              v-if="isDefined(item.ac) && item.tempAc"
              v-tippy="$t('general.temp')"
              data-test-temp
              class="text-warning text-xs"
            >
              +{{ item.tempAc }}
            </span>
          </div>
          <span
            v-if="item.maxAc !== item.ac"
            data-test-max
            class="text-2xs text-muted-foreground whitespace-nowrap"
          >
            {{ $t('general.max') }}: {{ item.maxAc }}
          </span>
        </button>
      </UiPopoverTrigger>
      <UiPopoverContent>
        <div
          v-if="isDefined(item.ac) && isDefined(item.maxAc)"
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
                v-if="item.maxAcOld === 0 || item.maxAcOld"
                class="text-sm"
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
          v-if="hasAc"
          id="InitiativeRowAcUpdate"
          type="form"
          :actions="false"
          @submit="updateAc"
        >
          <FormDiceRollInput />
          <div class="flex items-center gap-x-2">
            <FormKit
              type="submit"
              input-class="$remove:btn-foreground btn-success flex items-center gap-x-2 px-2 border-2 text-sm"
              @click="selectedType = 'add'"
            >
              <Icon
                name="tabler:plus"
                class="size-4 min-w-4"
                aria-hidden="true"
              />
              {{ $t('actions.heal') }}
            </FormKit>
            <FormKit
              type="submit"
              input-class="$remove:btn-foreground btn-warning flex items-center gap-x-2 px-2 border-2 text-sm"
              @click="selectedType = 'temp'"
            >
              <Icon
                name="tabler:plus"
                class="size-4 min-w-4"
                aria-hidden="true"
              />
              {{ $t('actions.temp') }}
            </FormKit>
            <FormKit
              type="submit"
              input-class="$remove:btn-foreground btn-destructive flex items-center gap-x-2 px-2 border-2 text-sm"
              @click="selectedType = 'remove'"
            >
              <Icon
                name="tabler:sword"
                class="size-4 min-w-4"
                aria-hidden="true"
              />
              {{ $t('actions.damage') }}
            </FormKit>
          </div>
        </FormKit>
        <UiSeparator
          v-if="hasAc"
          class="my-6 bg-muted-foreground"
        />
        <FormKit
          id="InitiativeRowAcBase"
          type="form"
          :submit-label="$t('actions.save')"
          @submit="updateBase"
        >
          <FormKit
            type="number"
            name="amount"
            number
            :label="$t('components.inputs.baseFieldLabel', { field: 'AC' })"
            :help="$t('components.inputs.baseFieldHelp', { field: 'AC' })"
            validation="required|between:1,100|number"
          />
        </FormKit>
        <UiSeparator
          v-if="hasAc"
          class="my-6 bg-muted-foreground"
        />
        <FormKit
          v-if="hasAc"
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
