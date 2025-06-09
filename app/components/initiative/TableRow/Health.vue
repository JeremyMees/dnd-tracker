<script setup lang="ts">
import { reset } from '@formkit/core'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { useToast } from '~/components/ui/toast/use-toast'
import { hpFunctions, deathSavesFunctions } from '~/utils/dnd-helpers'

const props = defineProps<{ item: InitiativeSheetRow }>()

const { sheet, update } = validateInject(INITIATIVE_SHEET)

const { t } = useI18n()
const { toast } = useToast()

const { hasDeathSaves, checkDeathSaves, addDeathSave, resetDeathSaves } = deathSavesFunctions
const { heal, damage, temp, override, overrideReset } = hpFunctions

const popoverOpen = shallowRef<boolean>(false)
const selectedType = shallowRef<HealthType>('heal')

const hasHp = computed(() => isDefined(props.item.health) && isDefined(props.item.maxHealth))

type HealthType = 'heal' | 'damage' | 'temp' | 'override' | 'override-reset'
interface HealthForm { amount: number }

async function updateRow(row: Partial<InitiativeSheetRow>): Promise<void> {
  if (!sheet.value) return

  const index = getCurrentRowIndex(sheet.value, props.item.id)
  const rows = [...sheet.value.rows]

  if (index === -1 || !rows[index]) return

  rows[index] = { ...rows[index], ...row }

  await update({ rows })
  popoverOpen.value = false
}

async function updateBase(form: HealthForm, node: FormNode): Promise<void> {
  node.clearErrors()

  try {
    if (!sheet.value) return

    const { amount } = sanitizeForm<HealthForm>(form)
    const row = {
      ...props.item,
      maxHealth: amount,
      maxHealthOld: undefined,
      health: amount,
    }

    await updateRow(row)
  }
  catch {
    reset('InitiativeRowHealthBase')
    node.setErrors(t('general.error.text'))
  }
}

async function updateOverride(form: HealthForm & { reset?: boolean }, node: FormNode): Promise<void> {
  node.clearErrors()

  try {
    if (!sheet.value) return

    const { amount, reset } = sanitizeForm<HealthForm & { reset?: boolean }>(form)

    const row = reset || amount === props.item.maxHealthOld
      ? handleHpChanges(props.item.maxHealthOld ?? 0, 'override-reset')
      : handleHpChanges(amount, 'override')

    await updateRow(row)
  }
  catch {
    reset('InitiativeRowHealthOverride')
    node.setErrors(t('general.error.text'))
  }
}

async function updateHealth(form: HealthForm, node: FormNode): Promise<void> {
  node.clearErrors()

  try {
    const selected = selectedType.value

    if (!sheet.value || !selected) return

    const { amount, type } = sanitizeForm<HealthForm & { type?: HealthType }>({ ...form, type: selected })

    const row = handleHpChanges(amount, type || 'heal')

    await updateRow(row)
  }
  catch {
    reset('InitiativeRowHealthUpdate')
    node.setErrors(t('general.error.text'))
  }
}

function handleHpChanges(amount: number, type: HealthType): InitiativeSheetRow {
  const row = { ...props.item }
  const noHp = typeof row.health === 'number' && row.health <= 0

  if (type === 'heal') {
    if (hasDeathSaves(row.type) && noHp) row.deathSaves = resetDeathSaves()

    heal(row, amount)
  }
  else if (type === 'temp') temp(row, amount)
  else if (type === 'override') override(row, amount)
  else if (type === 'override-reset') overrideReset(row, amount)
  else if (type === 'damage') {
    damage(row, amount)

    const downed = typeof row.health === 'number' && row.health <= 0

    // if the health is 0 or less, add 2 death save failures
    if (hasDeathSaves(row.type) && downed) {
      if (!row.deathSaves) {
        row.deathSaves = {
          fail: [false, false, false],
          save: [false, false, false],
        }
      }

      row.deathSaves = addDeathSave(row.deathSaves, 'fail', 2)
    }

    if (row.concentration && !downed) {
      toast({
        title: t('components.initiativeTable.concentration.title'),
        description: t('components.initiativeTable.concentration.text', { name: row.name }),
        variant: 'info',
      })
    }

    if (downed && (row.concentration || row.conditions.length)) {
      row.concentration = false
      row.conditions = []

      toast({
        title: t('components.initiativeTable.downed.title', { name: row.name }),
        description: t('components.initiativeTable.downed.text', { name: row.name }),
        variant: 'info',
      })
    }
  }

  // when user is dies because of going to much in the negative hp
  const dead = (row.health && row.maxHealth && row.health < 0 && Math.abs(row.health) >= row.maxHealth)
  const { failed, saved } = row.deathSaves ? checkDeathSaves(row.deathSaves) : { failed: false, saved: false }

  if (dead || (failed && !saved)) {
    toast({
      title: t('components.initiativeTable.died.title', { name: row.name }),
      description: t('components.initiativeTable.died.textMinHP', { name: row.name }),
      variant: 'info',
    })
  }

  if (!failed && saved) {
    toast({
      title: t('components.initiativeTable.stable.title', { name: row.name }),
      description: t('components.initiativeTable.stable.textDeathSaves', { name: row.name }),
      variant: 'info',
    })
  }

  // when health is an negative number change it to 0
  const resetNegative = sheet.value?.settings?.negative === false
  if (resetNegative && row.health && row.health < 0) row.health = 0

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
            'bg-destructive/20 p-2 rounded-lg w-fit': isDefined(item.health) && item.health <= 0,
          }"
          class="flex flex-col gap-y-1"
        >
          <div class="flex items-center gap-x-1">
            <Icon
              v-if="!isDefined(item.health) && item.type !== 'lair'"
              data-test-empty
              name="tabler:plus"
              class="size-5 min-w-5 text-foreground/10"
              aria-hidden="true"
            />
            <span
              v-else
              data-test-health
              :class="{ 'text-destructive': isDefined(item.health) && item.health <= 0 }"
            >
              {{ item.health }}
            </span>
            <span
              v-if="isDefined(item.health) && item.tempHealth"
              v-tippy="$t('general.temp')"
              data-test-temp
              class="text-warning text-xs"
            >
              +{{ item.tempHealth }}
            </span>
          </div>
          <span
            v-if="item.maxHealth !== item.health"
            data-test-max
            class="text-2xs text-muted-foreground whitespace-nowrap"
          >
            {{ $t('general.max') }}: {{ item.maxHealth }}
          </span>
        </button>
      </UiPopoverTrigger>
      <UiPopoverContent>
        <div
          v-if="isDefined(item.health) && isDefined(item.maxHealth)"
          class="flex flex-wrap gap-x-1 gap-y-2 pb-6 items-start justify-center"
        >
          <div class="p-2 rounded-lg space-y-4 min-w-[75px] bg-background text-center flex-1">
            <p class="font-bold text-muted-foreground text-xs">
              {{ $t('general.current') }}
            </p>
            <p
              class="head-2"
              :class="{ 'text-destructive': item.health < 1 }"
            >
              {{ item.health || 0 }}
            </p>
          </div>
          <div class="p-2 rounded-lg space-y-4 min-w-[75px] bg-background text-center flex-1">
            <p class="font-bold text-muted-foreground text-xs">
              {{ $t('general.max') }}
            </p>
            <div class="flex gap-1 items-start justify-center">
              <p
                class="head-2"
                :class="[!item.maxHealthOld ? undefined : item.maxHealthOld < item.maxHealth ? 'text-success' : 'text-destructive']"
              >
                {{ item.maxHealth || 0 }}
              </p>
              <p
                v-if="isDefined(item.maxHealthOld)"
                class="text-sm"
              >
                ({{ item.maxHealthOld }})
              </p>
            </div>
          </div>
          <div class="p-2 rounded-lg space-y-4 min-w-[75px] bg-background text-center flex-1">
            <p class="font-bold text-muted-foreground text-xs">
              {{ $t('general.temp') }}
            </p>
            <p class="head-2">
              {{ item.tempHealth || 0 }}
            </p>
          </div>
        </div>
        <FormKit
          v-if="hasHp"
          id="InitiativeRowHealthUpdate"
          type="form"
          :actions="false"
          @submit="updateHealth"
        >
          <FormDiceRollInput />
          <div class="flex items-center gap-x-2">
            <FormKit
              type="submit"
              input-class="$remove:btn-foreground btn-success flex items-center gap-x-2 px-2 border-2 text-sm"
              @click="selectedType = 'heal'"
            >
              <Icon
                name="tabler:heart"
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
              @click="selectedType = 'damage'"
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
          v-if="hasHp"
          class="my-6 bg-muted-foreground"
        />
        <FormKit
          id="InitiativeRowHealthBase"
          type="form"
          :submit-label="$t('actions.save')"
          @submit="updateBase"
        >
          <FormKit
            type="number"
            name="amount"
            number
            :label="$t('components.inputs.baseFieldLabel', { field: 'HP' })"
            :help="$t('components.inputs.baseFieldHelp', { field: 'HP' })"
            validation="required|between:1,1000|number"
          />
        </FormKit>
        <UiSeparator
          v-if="hasHp"
          class="my-6 bg-muted-foreground"
        />
        <FormKit
          v-if="hasHp"
          id="InitiativeRowHealthOverride"
          type="form"
          :submit-label="$t('actions.save')"
          @submit="updateOverride"
        >
          <FormKit
            type="number"
            name="amount"
            number
            :label="$t('components.inputs.overrideFieldLabel', { field: 'HP' })"
            :help="$t('components.inputs.optionalFieldHelp', { field: 'HP' })"
            validation="required|between:1,1000|number"
            :suffix-icon="item.maxHealthOld ? 'tabler:player-skip-back' : undefined"
            @suffix-icon-click="(node: FormNode) => updateOverride({ reset: true, amount: item.maxHealthOld || 0 }, node)"
          />
        </FormKit>
      </UiPopoverContent>
    </UiPopover>
  </div>
</template>
