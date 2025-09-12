<script setup lang="ts">
import { reset } from '@formkit/core'
import { useToast } from '~/components/ui/toast/use-toast'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'

const props = defineProps<{
  attackBonus: number | undefined
  damageDice: string | undefined
  damageBonus: number
  id: string
}>()

const { sheet, update } = validateInject(INITIATIVE_SHEET)

const { t } = useI18n()
const { toast } = useToast()

type RollType = 'advantage' | 'straight' | 'disadvantage'

const popoverOpen = ref(false)

const result = ref<{
  attackRoll: number
  attackTotal: number
  rolledToHit: number[]
  damageRolled: Record<number, number[]>
  totalDamage: number
  rollType: RollType
}>()

const targets = computed(() => {
  return sheet.value?.rows
    .filter(row => row.id !== props.id)
    .map(row => ({ label: row.name, value: row.id }))
})

function onRoll(type: RollType) {
  const rolledToHit: number[] = [randomRoll(20)]

  if (type !== 'straight') rolledToHit.push(randomRoll(20))

  let attackRoll: number
  if (type === 'advantage') attackRoll = Math.max(...rolledToHit)
  else if (type === 'disadvantage') attackRoll = Math.min(...rolledToHit)
  else attackRoll = rolledToHit[0] ?? 0

  const dices = parseDamageDice(props.damageDice)
  const damageRolled: Record<number, number[]> = {}

  for (const { count, sides } of dices) {
    damageRolled[sides] = rollDice(sides, count).flat()
  }

  if (attackRoll === 20) {
    for (const { count, sides } of dices) {
      damageRolled[sides] = [
        ...(damageRolled[sides] ?? []),
        ...rollDice(sides, count).flat(),
      ]
    }
  }

  result.value = {
    rollType: type,
    attackRoll,
    attackTotal: attackRoll + (props.attackBonus ?? 0),
    rolledToHit,
    damageRolled,
    totalDamage: Object.values(damageRolled).flat().reduce((acc, curr) => acc + curr, 0) + props.damageBonus,
  }
}

function handleToasts(toasts: ToastItem[]): void {
  toasts.forEach(({ title, description, variant }) => {
    toast({
      title: t(title[0], title[1] ?? {}),
      description: t(description[0], description[1] ?? {}),
      variant,
    })
  })
}

async function handleSubmit(form: { target: string }, node: FormNode): Promise<void> {
  node.clearErrors()

  try {
    if (!sheet.value || !result.value) return

    const { target } = sanitizeForm<{ target: string }>(form)

    const index = getCurrentRowIndex(sheet.value, target)
    const rows = [...sheet.value.rows]

    if (
      index === -1
      || !rows[index]
      || (!isDefined(rows[index].health) && !isDefined(rows[index].hit_points))
    ) return

    const { row, toasts } = handleHpChanges(
      result.value.totalDamage,
      'damage',
      rows[index],
      sheet.value?.settings?.negative ?? false,
    )

    handleToasts(toasts)

    rows[index] = { ...rows[index], ...row }

    await update({ rows })
    popoverOpen.value = false
  }
  catch (err: any) {
    reset('ActionRoll')
    node.setErrors(t('general.error.text'))
  }
}
</script>

<template>
  <UiPopover
    v-model:open="popoverOpen"
    @update:open="(open) => {
      if (!open) result = undefined
    }"
  >
    <UiPopoverTrigger as-child>
      <button
        v-tippy="$t('actions.roll')"
        :aria-label="$t('actions.roll')"
        class="icon-btn-tertiary"
      >
        <Icon
          name="tabler:hexagon"
          :aria-hidden="true"
          class="text-tertiary"
        />
      </button>
    </UiPopoverTrigger>
    <UiPopoverContent>
      <UiPopoverHeader>
        <UiPopoverTitle>
          {{ $t('actions.roll') }}
        </UiPopoverTitle>
      </UiPopoverHeader>
      <div class="flex flex-col gap-y-6">
        <div class="flex items-center gap-x-2">
          <button
            :aria-label="$t('general.advantage')"
            class="btn-success flex items-center gap-x-2 px-2 border-2 text-sm"
            @click="onRoll('advantage')"
          >
            <Icon
              name="tabler:hexagon-plus"
              :aria-hidden="true"
            />
            <abbr :title="$t('general.advantage')">
              {{ $t('general.advantageAbb') }}
            </abbr>
          </button>
          <button
            :aria-label="$t('general.straight')"
            class="btn-foreground flex items-center gap-x-2 px-2 border-2 text-sm"
            @click="onRoll('straight')"
          >
            <Icon
              name="tabler:hexagon"
              :aria-hidden="true"
            />
            {{ $t('general.straight') }}
          </button>
          <button
            :aria-label="$t('general.disadvantage')"
            class="btn-destructive flex items-center gap-x-2 px-2 border-2 text-sm"
            @click="onRoll('disadvantage')"
          >
            <Icon
              name="tabler:hexagon-minus"
              :aria-hidden="true"
            />
            <abbr :title="$t('general.disadvantage')">
              {{ $t('general.disadvantageAbb') }}
            </abbr>
          </button>
        </div>
        <AnimationExpand>
          <div
            v-if="result"
            class="flex flex-col gap-y-4"
          >
            <UiSeparator />
            <div class="flex flex-col gap-y-1">
              <div>
                {{ $t('general.toHit') }}: {{ result.attackTotal }}
                <span
                  v-if="result.rollType !== 'straight'"
                  class="ml-2 text-muted-foreground text-xs"
                >
                  (<span
                    v-for="(roll, index) in result.rolledToHit"
                    :key="index"
                    :class="{
                      'text-success font-semibold': roll === 20,
                      'text-destructive font-semibold': roll === 1,
                    }"
                  >
                    {{ roll }}{{ index < result.rolledToHit.length - 1 ? ', ' : '' }}
                  </span>)
                  <abbr :title="$t(`general.${result.rollType}`)">
                    {{ $t(`general.${result.rollType}Abb`) }}
                  </abbr>
                  <span
                    v-if="props.attackBonus"
                    class="text-muted-foreground text-xs"
                  >
                    +{{ props.attackBonus }}
                  </span>
                </span>
              </div>
              <div>
                {{ $t('actions.damage') }}: {{ result.totalDamage }}
                <span
                  v-for="(value, key, index) in result.damageRolled"
                  :key="index"
                  class="text-muted-foreground text-xs"
                >
                  {{ value.length }}d{{ key }}
                  ({{ value.join(' + ') }})
                  {{ index < Object.keys(result.damageRolled).length - 1 ? ' + ' : '' }}
                </span>
                <span
                  v-if="props.damageBonus"
                  class="text-muted-foreground text-xs"
                >
                  +{{ props.damageBonus }}
                </span>
              </div>
            </div>
            <FormKit
              id="ActionRoll"
              type="form"
              :submit-label="$t('actions.applyDamage')"
              @submit="handleSubmit"
            >
              <FormKit
                type="select"
                name="target"
                :label="$t('components.inputs.targetLabel')"
                :placeholder="$t('components.inputs.nothing')"
                validation="required"
                :options="targets"
                outer-class="grow"
              />
            </FormKit>
          </div>
        </AnimationExpand>
      </div>
    </UiPopoverContent>
  </UiPopover>
</template>
