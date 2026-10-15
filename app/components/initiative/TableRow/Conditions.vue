<script setup lang="ts">
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { useConditionsListing } from '~/queries/srd'

const props = defineProps<{ item: InitiativeSheetRow }>()

const { sheet, patchRow } = validateInject(INITIATIVE_SHEET)

const selected = ref<DndCondition[]>([])
const popoverOpen = ref<boolean>(false)

const { data: conditions, isPending } = useConditionsListing()

watch(popoverOpen, open => (selected.value = open ? props.item.conditions : []))

function removeCondition(name: string): void {
  patchRow(props.item.id, {
    conditions: props.item.conditions.filter(r => r.name !== name),
  })
}

function updateCondition(conditions: DndCondition[]): void {
  patchRow(props.item.id, { conditions })
  popoverOpen.value = false
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
}

function toggleSelected(item: DndCondition): void {
  const arr = [...selected.value]
  const index: number = arr.findIndex(s => s.id === item.id)

  if (index === -1) arr.push(item)
  else arr.splice(index, 1)

  selected.value = arr
}
</script>

<template>
  <div v-if="item.type !== 'lair'" class="flex items-center gap-2">
    <UiPopover v-model:open="popoverOpen">
      <UiPopoverTrigger as-child>
        <button
          test-id="trigger"
          :disabled="isPending"
          :class="{ 'cursor-progress': isPending }"
          class="h-[27px] flex flex-col justify-center"
        >
          <Icon
            name="tabler:plus"
            class="size-5 min-w-5 text-foreground/10"
            aria-hidden="true"
          />
        </button>
      </UiPopoverTrigger>
      <UiPopoverContent>
        <UiPopoverHeader>
          <UiPopoverTitle>
            {{ $t('pages.encounter.update.conditions') }}
          </UiPopoverTitle>
        </UiPopoverHeader>
        <div class="flex flex-wrap gap-2">
          <UiBadge
            v-for="condition in conditions"
            :key="condition.name"
            test-id="option"
            :variant="
              selected.map(s => s.name).includes(condition.name)
                ? 'default'
                : 'outline'
            "
            class="cursor-pointer"
            @click="toggleSelected(condition)"
          >
            {{ condition.name }}
          </UiBadge>
        </div>
        <div class="flex justify-end mt-4">
          <UiButton
            test-id="update"
            variant="foreground"
            :aria-label="$t('actions.update')"
            @click="updateCondition(selected)"
          >
            {{ $t('actions.update') }}
          </UiButton>
        </div>
      </UiPopoverContent>
    </UiPopover>
    <div
      v-if="item.conditions.length"
      test-id="conditions"
      class="flex flex-wrap justify-center md:justify-start gap-1"
    >
      <UiPopover v-for="condition in item.conditions" :key="condition.name">
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
            :text="condition.desc"
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
            <FormConditionDuration
              :item="item"
              :condition="condition"
              :rows="rows"
              :active-row-id="activeRowId"
              @update="updateDuration(condition.name, $event)"
            />
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
