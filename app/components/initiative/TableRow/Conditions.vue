<script setup lang="ts">
import { useConditionsListing } from '~~/queries/open5e'

const props = defineProps<{
  item: InitiativeSheetRow
  sheet: InitiativeSheet | undefined
  update: (payload: Omit<Partial<InitiativeSheet>, NotUpdatable | 'campaign'>) => Promise<void>
}>()

type Condition = InitiativeSheetRow['conditions'][0]

const selected = ref<Condition[]>([])
const popoverOpen = ref<boolean>(false)

const { data: conditions, isPending } = await useConditionsListing()

watch(popoverOpen, open => selected.value = open ? props.item.conditions : [])

function removeCondition(name: string): void {
  if (!props.sheet) return

  const rows = props.sheet.rows

  props.update({
    rows: rows.map(row => row.id === props.item.id
      ? { ...row, conditions: row.conditions.filter(r => r.name !== name) }
      : row,
    ),
  })
}

function updateCondition(conditions: Condition[]): void {
  if (!props.sheet) return

  const index = getCurrentRowIndex(props.sheet, props.item.id)
  const rows = [...props.sheet.rows]

  if (index === -1 || !rows[index]) return

  rows[index] = { ...rows[index], conditions }

  props.update({ rows })

  popoverOpen.value = false
}

function toggleSelected(item: Open5eItem | Condition): void {
  const arr = [...selected.value]
  const index: number = arr.findIndex(s => s.name === item.name)

  const condition: Condition = {
    name: item.name,
    desc: typeof item.desc === 'string' ? item.desc : (item.desc as any)?.en || '',
    ...(item.level !== undefined && {
      level: typeof item.level === 'number' ? item.level : Number(item.level) || undefined,
    }),
    ...(('hasLevels' in item) && { hasLevels: item.hasLevels }),
  }

  if (index === -1) arr.push(condition)
  else arr.splice(index, 1)

  selected.value = arr
}

function listFromText(text: string, exhaustion: boolean = false): string[] {
  return exhaustion
    ? text
        .replace('*', '')
        .split(/\|\s\d+\s+\|/g)
        .slice(1)
        .map(bullet => bullet.split('|')[0])
        .filter((s): s is string => s !== undefined)
    : text.replace('*', '').split(/\s\*\s/g)
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
          <button
            class="btn-foreground"
            :aria-label="$t('actions.update')"
            @click="updateCondition(selected)"
          >
            {{ $t('actions.update') }}
          </button>
        </div>
      </UiPopoverContent>
    </UiPopover>
    <div
      v-if="item.conditions.length"
      class="flex flex-wrap justify-center md:justify-start gap-1"
    >
      <UiPopover
        v-for="condition in item.conditions"
        :key="condition.name"
      >
        <UiPopoverTrigger>
          <UiBadge class="whitespace-nowrap">
            {{ condition.name }} {{ condition.level ? `(${condition.level})` : '' }}
          </UiBadge>
        </UiPopoverTrigger>
        <UiPopoverContent>
          <UiPopoverHeader>
            <UiPopoverTitle>{{ condition.name }}</UiPopoverTitle>
          </UiPopoverHeader>
          <template v-if="condition.desc">
            <ul class="mx-6">
              <li
                v-for="bullet in listFromText(condition.desc, condition.name === 'Exhaustion')"
                :key="bullet"
                class="text-sm pb-1"
                :class="[condition.name === 'Exhaustion' ? 'list-decimal' : 'list-disc']"
              >
                {{ bullet }}
              </li>
            </ul>
          </template>
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
            <button
              :aria-label="$t('actions.remove')"
              class="btn-destructive"
              @click="removeCondition(condition.name)"
            >
              {{ $t('actions.remove') }}
            </button>
          </div>
        </UiPopoverContent>
      </UiPopover>
    </div>
  </div>
</template>
