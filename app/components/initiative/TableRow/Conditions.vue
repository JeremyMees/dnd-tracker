<script setup lang="ts">
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { useConditionsListing } from '~~/queries/open5e'

const props = defineProps<{ item: InitiativeSheetRow }>()

const { sheet, update } = validateInject(INITIATIVE_SHEET)

const selected = ref<DndCondition[]>([])
const popoverOpen = ref<boolean>(false)

const { data: conditions, isPending } = useConditionsListing()

watch(popoverOpen, open => selected.value = open ? props.item.conditions : [])

function removeCondition(name: string): void {
  if (!sheet.value) return

  const rows = sheet.value.rows

  update({
    rows: rows.map(row => row.id === props.item.id
      ? { ...row, conditions: row.conditions.filter(r => r.name !== name) }
      : row,
    ),
  })
}

function updateCondition(conditions: DndCondition[]): void {
  if (!sheet.value) return

  const index = getCurrentRowIndex(sheet.value, props.item.id)
  const rows = [...sheet.value.rows]

  if (index === -1 || !rows[index]) return

  rows[index] = { ...rows[index], conditions }

  update({ rows })

  popoverOpen.value = false
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
  <div
    v-if="item.type !== 'lair'"
    class="flex items-center gap-2"
  >
    <UiPopover v-model:open="popoverOpen">
      <UiPopoverTrigger as-child>
        <button
          data-test-trigger
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
            :variant="selected.map(s => s.name).includes(condition.name) ? 'default' : 'outline'"
            class="cursor-pointer"
            @click="toggleSelected(condition)"
          >
            {{ condition.name }}
          </UiBadge>
        </div>
        <div class="flex justify-end mt-4">
          <UiButton
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
      data-test-conditions
      class="flex flex-wrap justify-center md:justify-start gap-1"
    >
      <UiPopover
        v-for="condition in item.conditions"
        :key="condition.name"
      >
        <UiPopoverTrigger>
          <UiBadge
            data-test-badge
            class="whitespace-nowrap"
          >
            {{ condition.name }} {{ condition.level ? `(${condition.level})` : '' }}
          </UiBadge>
        </UiPopoverTrigger>
        <UiPopoverContent>
          <UiPopoverHeader>
            <UiPopoverTitle>{{ condition.name }}</UiPopoverTitle>
          </UiPopoverHeader>
          <div
            v-dompurify-html="$md.render(condition.desc)"
            class="text-sm text-muted-foreground"
          />
          <UiNumberField
            v-if="condition.hasLevels"
            id="level"
            :default-value="condition.level || 1"
            :min="1"
            :max="6"
            class="w-[100px] mt-4"
            @update:model-value="(level) => {
              const updatedConditions = [...item.conditions].map(c => c.name === condition.name ? { ...c, level } : c)
              updateCondition(updatedConditions)
            }"
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
          <div class="flex justify-end mt-4">
            <UiButton
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
