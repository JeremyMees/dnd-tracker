<script setup generic="T" lang="ts">
import { useFieldArray } from 'vee-validate'

const props = withDefaults(defineProps<{
  name: string
  emptyObject: T
  label?: string
  max?: number
  min?: number
  required?: boolean
}>(), {
  max: 10,
  min: 0,
  required: false,
})

const { fields, prepend, remove, move } = useFieldArray(props.name)

function addItem() {
  if (fields.value.length < props.max) prepend(props.emptyObject)
}

function removeItem(index: number) {
  if (fields.value.length > props.min) remove(index)
}

function moveUp(index: number) {
  if (index > 0) move(index, index - 1)
}

function moveDown(index: number) {
  if (index < fields.value.length - 1) move(index, index + 1)
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-end justify-between gap-2">
      <UiLabel
        v-if="label"
        data-test-label
        :required="required"
      >
        {{ label }}
      </UiLabel>
      <UiButton
        type="button"
        variant="default"
        size="sm"
        :disabled="fields.length >= max"
        @click="addItem"
      >
        <Icon name="tabler:plus" />
        {{ $t('actions.add') }}
      </UiButton>
    </div>

    <div class="space-y-4">
      <div
        v-for="(field, index) in fields"
        :key="field.key"
        class="border rounded-lg p-4 flex gap-2 items-start"
      >
        <div class="flex-1">
          <slot
            name="item"
            :item="field"
            :index="index"
            :field-name="`${name}.${index}`"
          />
        </div>

        <div class="flex flex-col gap-2">
          <UiButton
            v-tippy="$t('actions.moveUp')"
            type="button"
            variant="default-ghost"
            size="icon-sm"
            :disabled="index === 0"
            @click="moveUp(index)"
          >
            <Icon name="tabler:arrow-up" />
          </UiButton>
          <UiButton
            v-tippy="$t('actions.moveDown')"
            type="button"
            variant="default-ghost"
            size="icon-sm"
            :disabled="index === fields.length - 1"
            @click="moveDown(index)"
          >
            <Icon name="tabler:arrow-down" />
          </UiButton>
          <UiButton
            v-tippy="$t('actions.remove')"
            type="button"
            variant="destructive-ghost"
            size="icon-sm"
            :disabled="fields.length <= min"
            @click="removeItem(index)"
          >
            <Icon name="tabler:trash" />
          </UiButton>
        </div>
      </div>

      <div
        v-if="fields.length === 0"
        class="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg text-sm"
      >
        {{ $t('components.repeaterInput.noItems') }}
      </div>
    </div>
  </div>
</template>
