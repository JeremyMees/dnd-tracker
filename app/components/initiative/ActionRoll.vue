<script setup lang="ts">
import { useToast } from '~/components/ui/toast/use-toast'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import * as z from 'zod'

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

const popoverOpen = shallowRef(false)
const formError = ref<string>('')

const formSchema = toTypedSchema(z.object({
  target: z.string().min(2).max(50),
}))

const form = useForm({
  validationSchema: formSchema,
})

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

const onSubmit = form.handleSubmit(async (values) => {
  formError.value = ''

  try {
    if (!sheet.value) return

    const index = getCurrentRowIndex(sheet.value, values.target)
    const rows = [...sheet.value.rows]

    if (
      index === -1
      || !rows[index]
      || (!isDefined(rows[index].health) && !isDefined(rows[index].hit_points))
    ) return

    const { row, toasts } = handleHpChanges(
      result.value?.totalDamage ?? 0,
      'damage',
      rows[index],
      sheet.value?.settings?.negative ?? false,
    )

    handleToasts(toasts)

    rows[index] = { ...rows[index], ...row }

    await update({ rows })
    popoverOpen.value = false

    animateTableUpdate(`${values.target}-hp`, 'red')
  }
  catch (err: any) {
    formError.value = err.message || 'An error occurred during action roll'
  }
})
</script>

<template>
  <UiPopover
    v-model:open="popoverOpen"
    @update:open="(open: boolean) => {
      if (!open) result = undefined
    }"
  >
    <UiPopoverTrigger as-child>
      <UiButton
        v-tippy="$t('actions.roll')"
        variant="tertiary-ghost"
        size="icon-sm"
        :aria-label="$t('actions.roll')"
        class="group"
      >
        <Icon
          name="tabler:hexagon"
          :aria-hidden="true"
          class="text-tertiary group-hover:text-foreground transition-colors"
        />
      </UiButton>
    </UiPopoverTrigger>
    <UiPopoverContent>
      <UiPopoverHeader>
        <UiPopoverTitle>
          {{ $t('actions.roll') }}
        </UiPopoverTitle>
      </UiPopoverHeader>
      <div
        v-auto-animate
        class="flex flex-col gap-y-6"
      >
        <div class="flex items-center gap-x-2">
          <UiButton
            :aria-label="$t('general.advantage')"
            variant="success"
            size="sm"
            class="border-2"
            @click="onRoll('advantage')"
          >
            <Icon
              name="tabler:hexagon-plus"
              :aria-hidden="true"
            />
            <abbr :title="$t('general.advantage')">
              {{ $t('general.advantageAbb') }}
            </abbr>
          </UiButton>
          <UiButton
            :aria-label="$t('general.straight')"
            variant="foreground"
            size="sm"
            class="border-2"
            @click="onRoll('straight')"
          >
            <Icon
              name="tabler:hexagon"
              :aria-hidden="true"
            />
            {{ $t('general.straight') }}
          </UiButton>
          <UiButton
            :aria-label="$t('general.disadvantage')"
            variant="destructive"
            size="sm"
            class="border-2"
            @click="onRoll('disadvantage')"
          >
            <Icon
              name="tabler:hexagon-minus"
              :aria-hidden="true"
            />
            <abbr :title="$t('general.disadvantage')">
              {{ $t('general.disadvantageAbb') }}
            </abbr>
          </UiButton>
        </div>
        <div
          v-if="result"
          v-auto-animate
          class="flex flex-col gap-y-4"
        >
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

          <UiSeparator
            v-if="targets?.length"
            class="bg-muted"
          />

          <UiFormWrapper
            v-if="targets?.length"
            @submit="onSubmit"
          >
            <UiFormField
              v-slot="{ componentField }"
              name="target"
            >
              <UiFormItem>
                <UiFormLabel>{{ $t('components.inputs.targetLabel') }}</UiFormLabel>
                <UiSelect v-bind="componentField">
                  <UiFormControl>
                    <UiSelectTrigger>
                      <UiSelectValue :placeholder="$t('components.inputs.nothing')" />
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
              v-if="formError"
              class="text-sm text-destructive"
            >
              {{ formError }}
            </div>
            <UiButton
              type="submit"
              class="w-full"
            >
              {{ $t('actions.applyDamage') }}
            </UiButton>
          </UiFormWrapper>
        </div>
      </div>
    </UiPopoverContent>
  </UiPopover>
</template>
