<script setup lang="ts">
import { reset } from '@formkit/core'

const badge = useBadges()
const { t } = useI18n()

const input = ref()

onMounted(() => input.value && focusInput(input.value))

async function handleSubmit(form: BadgeClaim, node: FormNode): Promise<void> {
  node.clearErrors()

  try {
    const { code } = sanitizeForm<BadgeClaim>(form)

    await badge.addBadge(code)

    reset('form')
  }
  catch (err: any) {
    reset('form')
    node.setErrors(err.message)
  }
}
</script>

<template>
  <FormKit
    id="form"
    type="form"
    :submit-label="t('components.badgeModal.add')"
    @submit="handleSubmit"
  >
    <FormKit
      ref="input"
      name="code"
      :label="t('components.inputs.codeLabel')"
      validation="required|length:3,30"
    />
  </FormKit>
</template>
