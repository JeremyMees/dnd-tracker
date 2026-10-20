<script setup lang="ts">
import { useForm } from 'vee-validate'
import { abilityTypeMap, damageTypes } from '~~/constants/dnd'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'

const props = defineProps<{ prefill?: AreaDamagePrefill }>()

const open = defineModel<boolean>('open', { required: true })

const { t } = useI18n()
const { sheet, patchRow } = validateInject(INITIATIVE_SHEET)
const bloodied = useBloodiedCondition(() => sheet.value?.settings)
const handleToasts = useToastItems()

const defaults = { ability: 'dexterity', halfOnSave: true } as const

const form = useForm({
  validationSchema: areaDamageSchema,
  initialValues: defaults,
})

const selected = ref<string[]>([])
const rolls = ref<Record<string, number>>({})
const overrides = ref<Record<string, boolean>>({})
const formError = shallowRef<string>('')
const markUsed = shallowRef<boolean>(true)

const source = computed(() => {
  const from = props.prefill?.source
  const row = sheet.value?.rows.find(item => item.id === from?.rowId)
  const action = row?.actions?.find(item => item.name === from?.action)

  if (!row || !action || !actionUseLimit(action)) return undefined

  return { row, action, usesLeft: actionUsesLeft(row.resources, action) }
})

const targets = computed(
  () =>
    sheet.value?.rows.filter(
      row => row.type !== 'lair' && isDefined(row.hitPoints),
    ) ?? [],
)

const chosen = computed(() =>
  targets.value.filter(row => selected.value.includes(row.id)),
)

const hasSave = computed(() => isDefined(form.values.dc))

const askPlayers = computed(() =>
  hasSave.value ? chosen.value.filter(rollsOwnSave) : [],
)

function rollMissing(): void {
  const ability = form.values.ability

  if (!ability) return

  for (const row of chosen.value) {
    if (rollsOwnSave(row) || isDefined(rolls.value[row.id])) continue

    rolls.value[row.id] = rollSave(row, ability)
  }
}

function reroll(row: InitiativeSheetRow): void {
  if (!form.values.ability) return

  const { [row.id]: _override, ...rest } = overrides.value

  rolls.value[row.id] = rollSave(row, form.values.ability)
  overrides.value = rest
}

function toggle(id: string, value: boolean | 'indeterminate'): void {
  selected.value = value
    ? [...selected.value, id]
    : selected.value.filter(item => item !== id)
}

function isSaved(row: InitiativeSheetRow): boolean {
  const override = overrides.value[row.id]

  if (isDefined(override)) return override

  const roll = rolls.value[row.id]

  return isDefined(roll) && roll >= (form.values.dc ?? Infinity)
}

function damageFor(row: InitiativeSheetRow): number {
  return areaDamageAmount(form.values.amount ?? 0, {
    saved: hasSave.value && isSaved(row),
    halfOnSave: form.values.halfOnSave ?? true,
    defense: damageDefense(row, form.values.damageType),
  })
}

watch(selected, rollMissing)

watch(
  () => form.values.ability,
  () => {
    rolls.value = {}
    overrides.value = {}
    rollMissing()
  },
)

watch(open, value => {
  if (!value) return

  form.resetForm({ values: { ...defaults, ...props.prefill?.values } })
  markUsed.value = true
  selected.value = []
  rolls.value = {}
  overrides.value = {}
  formError.value = ''
})

async function damageRow(row: InitiativeSheetRow): Promise<void> {
  const amount = damageFor(row)

  if (!amount) return

  const { row: updated, toasts } = handleHpChanges(
    amount,
    'damage',
    row,
    sheet.value?.settings?.negative ?? false,
  )

  handleToasts(toasts)

  await patchRow(
    row.id,
    buildCombatPatch(row, withBloodied(updated, bloodied.value)),
  )

  animateTableUpdate(`${row.id}-hp`, 'red')
}

const onSubmit = form.handleSubmit(async () => {
  formError.value = ''

  try {
    await Promise.all([
      ...chosen.value.map(damageRow),
      ...(source.value?.usesLeft && markUsed.value
        ? [
            patchRow(source.value.row.id, {
              resources: markActionUsed(
                source.value.row.resources,
                source.value.action,
              ),
            }),
          ]
        : []),
    ])
    open.value = false
  } catch (err) {
    formError.value = getErrorMessage(err) || t('components.areaDamage.error')
  }
})
</script>

<template>
  <UiDialog v-model:open="open">
    <UiDialogContent test-id="area-damage" class="max-w-xl">
      <UiDialogHeader>
        <UiDialogTitle>
          {{ $t('components.areaDamage.title') }}
        </UiDialogTitle>
        <UiDialogDescription>
          {{ $t('components.areaDamage.description') }}
        </UiDialogDescription>
      </UiDialogHeader>

      <UiFormWrapper
        class="flex min-h-0 flex-col gap-4 space-y-0"
        @submit="onSubmit"
      >
        <UiDialogBody class="space-y-4">
          <div class="grid sm:grid-cols-2 gap-x-3 gap-y-2 items-start">
            <FormDiceRollInput />

            <UiFormField v-slot="{ value, handleChange }" name="damageType">
              <UiFormItem>
                <UiFormLabel>
                  {{ $t('components.inputs.damageTypeLabel') }}
                </UiFormLabel>
                <UiSelect
                  :model-value="value ?? 'none'"
                  @update:model-value="
                    v => handleChange(v === 'none' ? undefined : v)
                  "
                >
                  <UiFormControl>
                    <UiSelectTrigger test-id="damage-type">
                      <UiSelectValue />
                    </UiSelectTrigger>
                  </UiFormControl>
                  <UiSelectContent>
                    <UiSelectGroup>
                      <UiSelectItem value="none">
                        {{ $t('components.inputs.nothing') }}
                      </UiSelectItem>
                      <UiSelectItem
                        v-for="type in damageTypes"
                        :key="type"
                        :value="type"
                      >
                        {{ type.charAt(0).toUpperCase() + type.slice(1) }}
                      </UiSelectItem>
                    </UiSelectGroup>
                  </UiSelectContent>
                </UiSelect>
              </UiFormItem>
            </UiFormField>
          </div>

          <div class="grid sm:grid-cols-3 gap-x-3 gap-y-2 items-end">
            <UiFormField v-slot="{ componentField }" name="dc">
              <UiFormItem>
                <UiFormLabel>
                  {{ $t('components.areaDamage.dc') }}
                </UiFormLabel>
                <UiFormControl>
                  <UiInput test-id="dc" type="number" v-bind="componentField" />
                </UiFormControl>
                <UiFormMessage />
              </UiFormItem>
            </UiFormField>

            <UiFormField v-slot="{ value, handleChange }" name="ability">
              <UiFormItem>
                <UiFormLabel>
                  {{ $t('components.inputs.saveTypeLabel') }}
                </UiFormLabel>
                <UiSelect
                  :model-value="value"
                  :disabled="!hasSave"
                  @update:model-value="handleChange"
                >
                  <UiFormControl>
                    <UiSelectTrigger test-id="ability">
                      <UiSelectValue />
                    </UiSelectTrigger>
                  </UiFormControl>
                  <UiSelectContent>
                    <UiSelectGroup>
                      <UiSelectItem
                        v-for="(ability, short) in abilityTypeMap"
                        :key="ability"
                        :value="ability"
                      >
                        {{ short }}
                      </UiSelectItem>
                    </UiSelectGroup>
                  </UiSelectContent>
                </UiSelect>
              </UiFormItem>
            </UiFormField>

            <UiFormField v-slot="{ value, handleChange }" name="halfOnSave">
              <UiFormItem class="flex items-center gap-2 py-2">
                <UiFormControl>
                  <UiCheckbox
                    test-id="half-on-save"
                    :model-value="value"
                    :disabled="!hasSave"
                    class="mb-0"
                    @update:model-value="handleChange"
                  />
                </UiFormControl>
                <UiFormLabel>
                  {{ $t('components.areaDamage.halfOnSave') }}
                </UiFormLabel>
              </UiFormItem>
            </UiFormField>
          </div>

          <p
            v-if="askPlayers.length && form.values.ability"
            test-id="ask-players"
            class="flex items-start gap-2 rounded-lg bg-info/10 border border-info p-3 text-sm"
          >
            <Icon
              name="tabler:message-circle"
              class="size-5 min-w-5 text-info"
              aria-hidden="true"
            />
            {{
              $t('components.areaDamage.askPlayers', {
                names: askPlayers.map(row => row.name).join(', '),
                ability: formatAbilityShort(form.values.ability),
                dc: form.values.dc,
              })
            }}
          </p>

          <ul test-id="targets" class="flex flex-col divide-y divide-secondary">
            <li
              v-for="row in targets"
              :key="row.id"
              test-id="target"
              class="flex items-center gap-3 py-2"
            >
              <UiCheckbox
                :id="`area-damage-${row.id}`"
                test-id="select"
                :model-value="selected.includes(row.id)"
                @update:model-value="toggle(row.id, $event)"
              />
              <label
                :for="`area-damage-${row.id}`"
                class="flex-1 min-w-0 truncate"
              >
                {{ row.name }}
              </label>

              <template v-if="hasSave && selected.includes(row.id)">
                <span
                  v-if="isDefined(rolls[row.id])"
                  test-id="roll"
                  class="text-sm tabular-nums text-muted-foreground"
                >
                  {{ rolls[row.id] }}
                </span>
                <Tooltip
                  v-if="!rollsOwnSave(row)"
                  :text="$t('components.areaDamage.reroll')"
                >
                  <UiButton
                    test-id="reroll"
                    type="button"
                    variant="foreground-ghost"
                    size="icon-sm"
                    :aria-label="$t('components.areaDamage.reroll')"
                    @click="reroll(row)"
                  >
                    <Icon name="tabler:refresh" aria-hidden="true" />
                  </UiButton>
                </Tooltip>
                <label class="flex items-center gap-1 text-xs">
                  <UiCheckbox
                    test-id="saved"
                    :model-value="isSaved(row)"
                    @update:model-value="overrides[row.id] = $event === true"
                  />
                  {{ $t('components.areaDamage.saved') }}
                </label>
              </template>

              <span
                v-if="damageDefense(row, form.values.damageType)"
                test-id="defense"
                class="text-xs text-muted-foreground"
              >
                {{
                  $t(
                    `components.areaDamage.defense.${damageDefense(row, form.values.damageType)}`,
                  )
                }}
              </span>

              <span
                test-id="damage"
                class="w-10 text-right font-bold tabular-nums"
                :class="{ 'text-destructive': selected.includes(row.id) }"
              >
                {{ selected.includes(row.id) ? damageFor(row) : '–' }}
              </span>
            </li>
          </ul>

          <template v-if="source">
            <label
              v-if="source.usesLeft"
              test-id="mark-used"
              class="flex items-center gap-2 text-sm"
            >
              <UiCheckbox
                test-id="mark-used-checkbox"
                :model-value="markUsed"
                @update:model-value="markUsed = $event === true"
              />
              {{
                $t('components.areaDamage.markUsed', {
                  action: source.action.name,
                })
              }}
            </label>
            <p v-else test-id="used-up" class="text-sm text-warning">
              {{
                $t('components.areaDamage.usedUp', {
                  action: source.action.name,
                })
              }}
            </p>
          </template>
        </UiDialogBody>

        <div v-if="formError" class="shrink-0 text-sm text-destructive">
          {{ formError }}
        </div>

        <UiDialogFooter>
          <UiButton
            type="submit"
            variant="destructive"
            test-id="apply"
            class="w-full"
            :disabled="!chosen.length"
          >
            <Icon name="tabler:sword" aria-hidden="true" />
            {{ $t('components.areaDamage.apply', { count: chosen.length }) }}
          </UiButton>
        </UiDialogFooter>
      </UiFormWrapper>
    </UiDialogContent>
  </UiDialog>
</template>
