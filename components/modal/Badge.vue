<script setup lang="ts">
import { reset } from '@formkit/core'

const badge = useBadges()

const input = ref()

onMounted(() => input.value && focusInput(input.value))

async function handleSubmit(form: BadgeClaim, node: FormNode): Promise<void> {
  node.clearErrors()

  try {
    const { code } = sanitizeForm<BadgeClaim>(form)

    await badge.addBadge(code)

    reset('Badge')
  }
  catch (err: any) {
    reset('Badge')
    node.setErrors(err.message)
  }
}
</script>

<template>
  <FormKit
    id="Badge"
    type="form"
    :actions="false"
    @submit="handleSubmit"
  >
    <FormKit
      ref="input"
      name="code"
      :label="$t('components.inputs.codeLabel')"
      validation="required|length:3,30"
      outer-class="$remove:mb-4"
    />
  </FormKit>
</template>
