<script setup lang="ts">
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { useConditionsListing } from '~/queries/srd'

const props = defineProps<{ item: InitiativeSheetRow }>()

const { sheet, patchRow } = validateInject(INITIATIVE_SHEET)

const popoverOpen = ref<boolean>(false)

const { onRequest, isTarget } = useRowShortcut()

const isShortcutTarget = computed(() => isTarget(sheet.value, props.item.id))

onRequest(
  () => props.item.id,
  ['condition'],
  () => (popoverOpen.value = true),
)
const editingDuration = shallowRef<string>()

const { data: conditions, isPending } = useConditionsListing()

const descriptions = computed(
  () => new Map(conditions.value?.map(({ id, desc }) => [id, desc])),
)

function removeCondition(name: string): void {
  patchRow(props.item.id, {
    conditions: props.item.conditions.filter(r => r.name !== name),
  })
}

function updateCondition(conditions: DndCondition[]): void {
  patchRow(props.item.id, { conditions })
}

function addCondition(condition: DndCondition): void {
  patchRow(props.item.id, { conditions: [...props.item.conditions, condition] })
}

const rows = computed(() => sheet.value?.rows ?? [])
const activeRowId = computed(
  () => sheet.value?.rows[sheet.value.activeIndex]?.id,
)

function durationRowName(duration: DndConditionDuration): string {
  return (
    rows.value.find(row => row.id === duration.rowId)?.name ?? props.item.name
  )
}

function updateDuration(
  name: string,
  duration: DndConditionDuration | null,
): void {
  updateCondition(
    props.item.conditions.map(c => (c.name === name ? { ...c, duration } : c)),
  )
  editingDuration.value = undefined
}

function toggleDurationEditor(id: string): void {
  editingDuration.value = editingDuration.value === id ? undefined : id
}
</script>

<template>
  <div v-if="item.type !== 'lair'" class="flex items-center gap-2">
    <UiPopover v-model:open="popoverOpen">
      <UiPopoverTrigger as-child>
        <button
          test-id="trigger"
          :aria-label="$t('pages.encounter.update.conditions')"
          :disabled="isPending"
          :class="{ 'cursor-progress': isPending }"
          class="h-[27px] flex flex-col justify-center"
        >
          <Tooltip
            :text="$t('components.shortcuts.condition')"
            :shortcut="['C']"
            :disabled="!isShortcutTarget"
          >
            <span class="flex">
              <Icon
                name="tabler:plus"
                class="size-5 min-w-5 text-foreground/10"
                aria-hidden="true"
              />
            </span>
          </Tooltip>
        </button>
      </UiPopoverTrigger>
      <UiPopoverContent>
        <UiPopoverHeader>
          <UiPopoverTitle>
            {{ $t('pages.encounter.update.conditions') }}
          </UiPopoverTitle>
        </UiPopoverHeader>
        <ConditionPicker
          :conditions="conditions ?? []"
          :applied="item.conditions"
          :item="item"
          :rows="rows"
          :active-row-id="activeRowId"
          @add="addCondition"
          @remove="removeCondition($event.name)"
        />
      </UiPopoverContent>
    </UiPopover>
    <div
      v-if="item.conditions.length"
      test-id="conditions"
      class="flex flex-wrap justify-center md:justify-start gap-1"
    >
      <UiPopover
        v-for="condition in item.conditions"
        :key="condition.name"
        @update:open="open => !open && (editingDuration = undefined)"
      >
        <UiPopoverTrigger>
          <UiBadge test-id="badge" class="whitespace-nowrap">
            {{ condition.name }}
            {{ condition.level ? `(${condition.level})` : '' }}
            <span
              v-if="condition.duration"
              test-id="duration"
              class="inline-flex items-center gap-0.5"
            >
              <Icon
                :name="
                  condition.duration.rounds ? 'tabler:hourglass' : 'tabler:dice'
                "
                class="size-3"
                aria-hidden="true"
              />
              {{ condition.duration.rounds }}
              <span class="sr-only">
                {{
                  condition.duration.rounds
                    ? $t(
                        'components.conditionDuration.roundsLeft',
                        condition.duration.rounds,
                      )
                    : $t('components.conditionDuration.saveEnds')
                }}
              </span>
            </span>
          </UiBadge>
        </UiPopoverTrigger>
        <UiPopoverContent>
          <UiPopoverHeader>
            <UiPopoverTitle>{{ condition.name }}</UiPopoverTitle>
          </UiPopoverHeader>
          <MarkdownText
            :text="descriptions.get(condition.id) || condition.desc"
            class="text-sm text-muted-foreground"
          />
          <UiNumberField
            v-if="condition.hasLevels"
            id="level"
            :default-value="condition.level || 1"
            :min="1"
            :max="6"
            class="w-[100px] mt-4"
            @update:model-value="
              level => {
                const updatedConditions = [...item.conditions].map(c =>
                  c.name === condition.name ? { ...c, level } : c,
                )
                updateCondition(updatedConditions)
              }
            "
          >
            <UiLabel for="level">
              {{ $t('general.level') }}
            </UiLabel>
            <UiNumberFieldContent>
              <UiNumberFieldDecrement />
              <UiNumberFieldInput />
              <UiNumberFieldIncrement />
            </UiNumberFieldContent>
          </UiNumberField>
          <div class="flex flex-col gap-y-2 mt-4">
            <p class="font-semibold text-sm">
              {{ $t('components.conditionDuration.title') }}
            </p>
            <p
              v-if="condition.duration?.rounds"
              test-id="duration-rounds"
              class="text-sm text-muted-foreground"
            >
              {{
                $t(
                  `components.conditionDuration.summary.${condition.duration.timing}`,
                  {
                    count: condition.duration.rounds,
                    name: durationRowName(condition.duration),
                  },
                  condition.duration.rounds,
                )
              }}
            </p>
            <p
              v-if="condition.duration?.save"
              test-id="duration-save"
              class="text-sm text-muted-foreground"
            >
              {{
                $t(
                  `components.conditionDuration.summary.save.${condition.duration.timing}`,
                  {
                    ability: formatAbilityShort(
                      condition.duration.save.ability,
                    ),
                    dc: condition.duration.save.dc,
                    name: durationRowName(condition.duration),
                  },
                )
              }}
            </p>
            <p
              v-if="!condition.duration"
              test-id="duration-none"
              class="text-sm text-muted-foreground"
            >
              {{ $t('components.conditionDuration.clear') }}
            </p>
            <UiButton
              test-id="duration-toggle"
              type="button"
              variant="secondary"
              class="w-full justify-between"
              :aria-expanded="editingDuration === condition.id"
              @click="toggleDurationEditor(condition.id)"
            >
              {{
                $t(
                  condition.duration
                    ? 'components.conditionDuration.edit'
                    : 'components.conditionDuration.add',
                )
              }}
              <Icon
                name="tabler:chevron-down"
                class="transition-transform duration-200"
                :class="{ 'rotate-180': editingDuration === condition.id }"
                aria-hidden="true"
              />
            </UiButton>
            <AnimationExpand>
              <div
                v-show="editingDuration === condition.id"
                test-id="duration-editor"
                class="border rounded-lg p-4"
              >
                <FormConditionDuration
                  :item="item"
                  :condition="condition"
                  :rows="rows"
                  :active-row-id="activeRowId"
                  @update="updateDuration(condition.name, $event)"
                />
              </div>
            </AnimationExpand>
          </div>
          <div class="flex justify-end mt-4">
            <UiButton
              test-id="remove"
              :aria-label="$t('actions.remove')"
              variant="destructive"
              @click="removeCondition(condition.name)"
            >
              {{ $t('actions.remove') }}
            </UiButton>
          </div>
        </UiPopoverContent>
      </UiPopover>
    </div>
  </div>
</template>
