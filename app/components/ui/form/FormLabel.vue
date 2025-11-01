<script lang="ts" setup>
import type { LabelProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { Label } from '~/components/ui/label'
import { useFormField } from './useFormField'

const props = withDefaults(
  defineProps<LabelProps & {
    class?: HTMLAttributes['class']
    required?: boolean
  }>(),
  {
    required: false,
  },
)

const { error, formItemId } = useFormField()
</script>

<template>
  <Label
    :class="cn(
      error && 'text-destructive',
      props.class,
    )"
    :for="formItemId"
  >
    <slot />
    <span
      v-if="props.required"
      class="text-destructive"
    >*</span>
  </Label>
</template>
