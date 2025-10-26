<script setup lang="ts">
import { reset } from '@formkit/core'
import { useToast } from '~/components/ui/toast/use-toast'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'

const props = defineProps<{ item: InitiativeSheetRow }>()

const { sheet, update } = validateInject(INITIATIVE_SHEET)

const { t } = useI18n()
const { toast } = useToast()

const popoverOpen = shallowRef<boolean>(false)
const selectedType = shallowRef<HealthType>('heal')

const hasHp = computed(() => isDefined(props.item.health) && isDefined(props.item.maxHealth))

interface HealthForm { amount: number }

function handleToasts(toasts: ToastItem[]): void {
  toasts.forEach(({ title, description, variant }) => {
    toast({
      title: t(title[0], title[1] ?? {}),
      description: t(description[0], description[1] ?? {}),
      variant,
    })
  })
}

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

    const { row, toasts } = reset || amount === props.item.maxHealthOld
      ? handleHpChanges(props.item.maxHealthOld ?? 0, 'override-reset', props.item, sheet.value?.settings?.negative ?? false)
      : handleHpChanges(amount, 'override', props.item, sheet.value?.settings?.negative ?? false)

    handleToasts(toasts)

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

    try {
      const { row, toasts } = handleHpChanges(amount, type || 'heal', props.item, sheet.value?.settings?.negative ?? false)

      handleToasts(toasts)

      await updateRow(row)

      if (type === 'heal') animateTableUpdate(`${props.item.id}-hp`, 'green')
      if (type === 'damage') animateTableUpdate(`${props.item.id}-hp`, 'red')
    }
    catch (error) {
      console.error('Error updating health', error)
    }
  }
  catch {
    reset('InitiativeRowHealthUpdate')
    node.setErrors(t('general.error.text'))
  }
}
</script>

<template>
  <div>
    <UiPopover v-model:open="popoverOpen">
      <UiPopoverTrigger as-child>
        <button
          :id="`${item.id}-hp`"
          data-test-trigger
          :class="{
            'bg-destructive/20 p-2 w-fit': isDefined(item.health) && item.health <= 0,
          }"
          class="flex flex-col gap-y-1 rounded-lg"
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
      <UiPopoverContent class="max-h-[600px]">
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
