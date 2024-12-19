<script setup lang="ts">
import { reset } from '@formkit/core'

const emit = defineEmits<{
  confirm: [string]
  decline: [string]
}>()

const props = defineProps<{
  uuid: string
  title: string
  loading: boolean
  callback: (confirmed: boolean) => any
}>()

const input = ref()

onMounted(() => {
  setTimeout(() => input.value && focusInput(input.value), 50) // Delay because of transition animation
})

function deleteConfirmation(): void {
  reset('form')
  emit('confirm', props.uuid)
}

function close(): void {
  reset('form')
  emit('decline', props.uuid)
}
</script>

<template>
  <Modal @close="close">
    <template #header>
      <h2>
        {{ $t('components.confirmationModal.title') }}
      </h2>
    </template>
    <div class="text-white space-y-4">
      <div class="p-4 bg-danger/50 rounded-lg flex gap-4 items-center">
        <Icon
          name="tabler:alert-triangle"
          class="min-w-[30px] min-h-[30px]"
        />
        <I18nT
          keypath="components.confirmationModal.text"
          tag="p"
        >
          <template #title>
            <span class="font-bold">
              {{ title }}
            </span>
          </template>
        </I18nT>
      </div>
      <FormKit
        id="form"
        type="form"
        @submit="deleteConfirmation"
      >
        <FormKit
          ref="input"
          name="title"
          validation="required|is:delete,DELETE,Delete"
          placeholder="DELETE"
        />
        <template #actions>
          <div class="flex justify-end gap-2">
            <button
              type="button"
              class="btn-black"
              :aria-label="$t('actions.cancel')"
              @click="$emit('decline', uuid)"
            >
              {{ $t('actions.cancel') }}
            </button>
            <FormKit
              type="submit"
              outer-class="$reset !mb-0"
              input-class="$remove:btn-black btn-danger"
              :aria-label="$t('actions.delete')"
            >
              {{ $t('actions.delete') }}
            </FormKit>
          </div>
        </template>
      </FormKit>
    </div>
  </Modal>
</template>
