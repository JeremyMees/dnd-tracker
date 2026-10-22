<script setup lang="ts">
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { useForm } from 'vee-validate'
import * as z from 'zod'

const props = defineProps<{
  attackBonus: number | undefined
  damage: DndAttackDamage[]
  id: string
}>()

const { sheet, patchRow, log } = validateInject(INITIATIVE_SHEET)
const bloodied = useBloodiedCondition(() => sheet.value?.settings)

type RollType = 'advantage' | 'straight' | 'disadvantage'

const popoverOpen = shallowRef(false)

const formSchema = z.object({
  target: z.string().min(2).max(50),
})

const form = useForm({
  validationSchema: formSchema,
})

const result = ref<{
  attackRoll: number
  attackTotal: number
  rolledToHit: number[]
  damageRolled: Record<number, number[]>
  rolls: DndDamageRoll[]
  totalDamage: number
  rollType: RollType
  miss: boolean
}>()

const targets = computed(() => {
  return sheet.value?.rows
    .filter(row => row.id !== props.id && isDefined(row.hitPoints))
    .map(row => ({ label: row.name, value: row.id }))
})

function onRoll(type: RollType) {
  const rolledToHit: number[] = [randomRoll(20)]

  if (type !== 'straight') rolledToHit.push(randomRoll(20))

  let attackRoll: number
  if (type === 'advantage') attackRoll = Math.max(...rolledToHit)
  else if (type === 'disadvantage') attackRoll = Math.min(...rolledToHit)
  else attackRoll = rolledToHit[0] ?? 0

  const damageRolled: Record<number, number[]> = {}

  const rolls = props.damage.map(part => {
    const dices = parseDamageDice(part.dice)
    let amount = part.bonus

    for (const { count, sides } of attackRoll === 20
      ? [...dices, ...dices]
      : dices) {
      const rolled = rollDice(sides, count)

      damageRolled[sides] = [...(damageRolled[sides] ?? []), ...rolled]
      amount += rolled.reduce((acc, curr) => acc + curr, 0)
    }

    return { amount, type: part.type }
  })

  result.value = {
    rollType: type,
    miss: attackRoll === 1,
    attackRoll,
    attackTotal: attackRoll + (props.attackBonus ?? 0),
    rolledToHit,
    damageRolled,
    rolls,
    totalDamage: rolls.reduce((acc, roll) => acc + roll.amount, 0),
  }

  const { miss, attackTotal, totalDamage } = result.value

  log?.([
    {
      type: 'roll',
      rowId: props.id,
      payload: {
        rowName: sheet.value?.rows.find(row => row.id === props.id)?.name,
        kind: 'attack',
        result: miss ? 'miss' : attackRoll === 20 ? 'critical' : 'hit',
        total: attackTotal,
        damage: miss ? undefined : totalDamage,
      },
    },
  ])
}

const handleToasts = useToastItems()

const damageBonus = computed(() =>
  props.damage.reduce((acc, part) => acc + part.bonus, 0),
)

const selectedTarget = computed(() =>
  sheet.value?.rows.find(row => row.id === form.values.target),
)

const targetDefenses = computed(() =>
  selectedTarget.value
    ? damageDefenses(selectedTarget.value, result.value?.rolls ?? [])
    : [],
)

const onSubmit = form.handleSubmit(async values => {
  if (!sheet.value || result.value?.miss) return

  const target = sheet.value.rows.find(row => row.id === values.target)

  if (!target || !isDefined(target.hitPoints)) return

  const { row, toasts } = handleHpChanges(
    damageAfterDefenses(target, result.value?.rolls ?? []),
    'damage',
    target,
    sheet.value?.settings?.negative ?? false,
    { critical: result.value?.attackRoll === 20 },
  )

  handleToasts(toasts)

  const patch = buildCombatPatch(target, withBloodied(row, bloodied.value))

  try {
    await patchRow(values.target, patch)
  } catch {
    return
  }

  popoverOpen.value = false

  animateTableUpdate(`${values.target}-hp`, 'red')
})
</script>

<template>
  <UiPopover
    v-model:open="popoverOpen"
    @update:open="
      (open: boolean) => {
        if (!open) result = undefined
      }
    "
  >
    <UiPopoverTrigger as-child>
      <UiButton
        test-id="trigger"
        variant="tertiary"
        size="icon-sm"
        :aria-label="$t('actions.roll')"
        class="group"
      >
        <Tooltip :text="$t('actions.roll')">
          <Icon name="tabler:hexagon" :aria-hidden="true" />
        </Tooltip>
      </UiButton>
    </UiPopoverTrigger>
    <UiPopoverContent>
      <UiPopoverHeader>
        <UiPopoverTitle>
          {{ $t('actions.roll') }}
        </UiPopoverTitle>
      </UiPopoverHeader>
      <div v-auto-animate class="flex flex-col gap-y-6">
        <div class="flex items-center gap-x-2">
          <UiButton
            :aria-label="$t('general.advantage')"
            test-id="advantage"
            variant="success"
            size="sm"
            class="border-2"
            @click="onRoll('advantage')"
          >
            <Icon name="tabler:hexagon-plus" :aria-hidden="true" />
            <abbr :title="$t('general.advantage')">
              {{ $t('general.advantageAbb') }}
            </abbr>
          </UiButton>
          <UiButton
            :aria-label="$t('general.straight')"
            test-id="straight"
            variant="foreground"
            size="sm"
            class="border-2"
            @click="onRoll('straight')"
          >
            <Icon name="tabler:hexagon" :aria-hidden="true" />
            {{ $t('general.straight') }}
          </UiButton>
          <UiButton
            :aria-label="$t('general.disadvantage')"
            test-id="disadvantage"
            variant="destructive"
            size="sm"
            class="border-2"
            @click="onRoll('disadvantage')"
          >
            <Icon name="tabler:hexagon-minus" :aria-hidden="true" />
            <abbr :title="$t('general.disadvantage')">
              {{ $t('general.disadvantageAbb') }}
            </abbr>
          </UiButton>
        </div>
        <div v-if="result" v-auto-animate class="flex flex-col gap-y-4">
          <UiSeparator class="bg-muted" />

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
                  {{ roll
                  }}{{
                    index < result.rolledToHit.length - 1 ? ', ' : ''
                  }} </span
                >)
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
            <p v-if="result.miss" test-id="miss" class="text-destructive">
              {{ $t('general.naturalOneMiss') }}
            </p>
            <div>
              {{ $t('actions.damage') }}: {{ result.totalDamage }}
              <span
                v-for="(value, key, index) in result.damageRolled"
                :key="index"
                class="text-muted-foreground text-xs"
              >
                {{ value.length }}d{{ key }} ({{ value.join(' + ') }})
                {{
                  index < Object.keys(result.damageRolled).length - 1
                    ? ' + '
                    : ''
                }}
              </span>
              <span v-if="damageBonus" class="text-muted-foreground text-xs">
                +{{ damageBonus }}
              </span>
            </div>
          </div>

          <UiSeparator
            v-if="targets?.length && !result.miss"
            class="bg-muted"
          />

          <UiFormWrapper
            v-if="targets?.length && !result.miss"
            @submit="onSubmit"
          >
            <UiFormField v-slot="{ componentField }" name="target">
              <UiFormItem>
                <UiFormLabel>{{
                  $t('components.inputs.targetLabel')
                }}</UiFormLabel>
                <UiSelect v-bind="componentField">
                  <UiFormControl>
                    <UiSelectTrigger>
                      <UiSelectValue
                        :placeholder="$t('components.inputs.nothing')"
                      />
                    </UiSelectTrigger>
                  </UiFormControl>
                  <UiSelectContent>
                    <UiSelectGroup>
                      <UiSelectItem
                        v-for="target in targets"
                        :key="target.value"
                        :value="target.value"
                      >
                        {{ target.label }}
                      </UiSelectItem>
                    </UiSelectGroup>
                  </UiSelectContent>
                </UiSelect>
                <UiFormMessage />
              </UiFormItem>
            </UiFormField>
            <div
              v-if="selectedTarget && targetDefenses.length"
              test-id="target-damage"
              class="flex flex-col gap-2"
            >
              <span class="flex flex-wrap gap-1">
                <UiBadge
                  v-for="{ type, defense } in targetDefenses"
                  :key="type"
                  test-id="defense"
                  variant="secondary"
                >
                  {{ type.charAt(0).toUpperCase() + type.slice(1) }}:
                  {{ $t(`components.areaDamage.defense.${defense}`) }}
                </UiBadge>
              </span>
              <span class="text-muted-foreground text-xs">
                {{
                  $t('components.actionsTable.targetDamage', {
                    name: selectedTarget.name,
                    amount: damageAfterDefenses(selectedTarget, result.rolls),
                  })
                }}
              </span>
            </div>
            <UiButton test-id="submit" type="submit" class="w-full">
              {{ $t('actions.applyDamage') }}
            </UiButton>
          </UiFormWrapper>
        </div>
      </div>
    </UiPopoverContent>
  </UiPopover>
</template>
