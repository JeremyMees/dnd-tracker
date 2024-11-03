<script setup lang="ts">
import { reset } from '@formkit/core'

const badge = useBadges()
const { t } = useI18n()

const isOpen = ref<boolean>(false)

async function handleSubmit(form: BadgeClaim, node: FormNode): Promise<void> {
  node.clearErrors()

  try {
    const { code } = sanitizeForm<BadgeClaim>(form)

    await badge.addBadge(code)

    resetState()
  }
  catch (err: any) {
    reset('form')
    node.setErrors(err.message)
  }
}

function resetState(): void {
  reset('form')
  isOpen.value = false
}
</script>

<template>
  <button
    class="btn-text"
    @click="isOpen = true"
  >
    {{ t('components.badgeModal.claim') }}
  </button>
  <Modal
    :open="isOpen"
    @close="resetState"
  >
    <template #header>
      <h2>
        {{ t('components.badgeModal.title') }}
      </h2>
    </template>
    <FormKit
      id="form"
      type="form"
      :submit-label="t('components.badgeModal.add')"
      @submit="handleSubmit"
    >
      <FormKit
        name="code"
        :label="t('components.inputs.codeLabel')"
        validation="required|length:3,30"
      />
    </FormKit>
  </Modal>
</template>
