<script setup lang="ts">
import { useFieldArray } from 'vee-validate'

const props = withDefaults(defineProps<{
  name: string
  type: HTMLInputElement['type']
  empty: string | number | undefined | null
  label?: string
  max?: number
  min?: number
  required?: boolean
}>(), {
  max: 10,
  min: 0,
  required: false,
})

const { fields, push, remove } = useFieldArray(props.name)

const canRemove = computed(() => fields.value.length > props.min)

function addItem() {
  if (fields.value.length < props.max) push(props.empty)
}

function removeItem(index: number) {
  if (fields.value.length > props.min) remove(index)
}
</script>

<template>
  <div class="space-y-2">
    <UiLabel
      v-if="label"
      :required="required"
    >
      {{ label }}
    </UiLabel>

    <div class="flex flex-col gap-2">
      <UiFormField
        v-for="(field, index) in fields"
        :key="field.key"
        v-slot="{ field: componentField }"
        class="flex-1"
        :name="`${name}.${index}`"
      >
        <UiFormItem v-auto-animate>
          <UiFormControl>
            <UiInputGroup>
              <UiInputGroupInput
                type="text"
                v-bind="componentField"
              />
              <UiInputGroupAddon
                align="inline-end"
                class=" has-[>button]:mr-0 pr-1"
              >
                <UiInputGroupButton
                  :aria-label="$t('actions.remove')"
                  type="button"
                  :disabled="!canRemove"
                  @click="removeItem(index)"
                >
                  <Icon name="tabler:trash" />
                </UiInputGroupButton>
              </UiInputGroupAddon>
            </UiInputGroup>
          </UiFormControl>
          <UiFormMessage />
        </UiFormItem>
      </UiFormField>
    </div>
    <UiButton
      v-if="fields.length < 10"
      type="button"
      variant="foreground-ghost"
      size="sm"
      :disabled="fields.length >= max"
      @click="addItem"
    >
      <Icon name="tabler:plus" />
      {{ $t('actions.addAnother') }}
    </UiButton>
    <span
      v-else
      class="text-destructive"
    >
      {{ $t('general.max') }} 10
    </span>
  </div>
</template>
