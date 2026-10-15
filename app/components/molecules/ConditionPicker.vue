<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    conditions: DndCondition[]
    applied: DndCondition[]
    item: Pick<InitiativeSheetRow, 'id' | 'name'>
    rows: Pick<InitiativeSheetRow, 'id' | 'name'>[]
    activeRowId?: string
    disabled?: boolean
  }>(),
  { activeRowId: undefined, disabled: false },
)

const emit = defineEmits<{
  add: [condition: DndCondition]
  remove: [condition: DndCondition]
}>()

const pending = shallowRef<DndCondition>()

const appliedIds = computed(() => props.applied.map(condition => condition.id))

function isApplied(condition: DndCondition): boolean {
  return appliedIds.value.includes(condition.id)
}

function isLocked(condition: DndCondition): boolean {
  if (props.disabled) return true

  return !!pending.value && pending.value.id !== condition.id
}

function select(condition: DndCondition): void {
  if (isLocked(condition)) return

  if (isApplied(condition)) emit('remove', condition)
  else pending.value = pending.value ? undefined : condition
}

function add(duration: DndConditionDuration | null): void {
  if (!pending.value) return

  emit('add', { ...pending.value, ...(duration && { duration }) })
  pending.value = undefined
}

watch(
  () => props.disabled,
  disabled => {
    if (disabled) pending.value = undefined
  },
)
</script>

<template>
  <div class="flex flex-col gap-y-4">
    <div class="flex flex-wrap gap-2">
      <UiBadge
        v-for="condition in conditions"
        :key="condition.id"
        test-id="option"
        :variant="
          isApplied(condition) || pending?.id === condition.id
            ? 'default'
            : 'outline'
        "
        role="button"
        :aria-pressed="isApplied(condition) || pending?.id === condition.id"
        :aria-disabled="isLocked(condition)"
        class="cursor-pointer"
        :class="{ 'opacity-50 pointer-events-none': isLocked(condition) }"
        @click="select(condition)"
      >
        {{ condition.name }}
      </UiBadge>
    </div>

    <AnimationExpand>
      <div
        v-if="pending"
        test-id="pending"
        class="flex flex-col gap-y-2 border rounded-lg p-4"
      >
        <p class="font-semibold text-sm">
          {{
            $t('components.conditionDuration.pending', { name: pending.name })
          }}
        </p>
        <FormConditionDuration
          :item="item"
          :condition="pending"
          :rows="rows"
          :active-row-id="activeRowId"
          allow-none
          @update="add"
        />
      </div>
    </AnimationExpand>
  </div>
</template>
