<script setup lang="ts">
import { reset } from '@formkit/core'

const emit = defineEmits<{ close: [] }>()
const props = defineProps<{ send: (addresses: string[]) => void }>()

const input = ref()

onMounted(() => {
  if (input.value) focusInput(input.value)
})

async function handleSubmit(form: MailForm, node: FormNode): Promise<void> {
  node.clearErrors()

  try {
    const formData = sanitizeForm<MailForm>(form)

    props.send(formData.mail)
    emit('close')
  }
  catch (err: any) {
    reset('Mail')
    node.setErrors(err.message)
  }
}
</script>

<template>
  <FormKit
    id="Mail"
    type="form"
    :actions="false"
    @submit="handleSubmit"
  >
    <FormKit
      v-slot="{ items, node, value }"
      name="mail"
      type="list"
      :value="['']"
      dynamic
    >
      <FormKit
        v-for="(item, index) in items"
        :key="item"
        :ref="index === 0 ? 'input' : undefined"
        :index="index"
        :label="$t('components.inputs.emailLabel')"
        validation="required|length:5,50|email"
        :suffix-icon="index !== 0 ? 'trash' : undefined"
        :sections-schema="{
          suffixIcon: {
            $el: 'button',
            $attrs: {
              type: 'button',
            },
          },
        }"
        @suffix-icon-click="() => node.input(value?.filter((_, i) => i !== index))"
      />
      <button
        v-if="items.length < 10"
        type="button"
        class="btn-text"
        @click="() => node.input(value?.concat(''))"
      >
        {{ $t('actions.addAnother') }}
      </button>
      <span
        v-else
        class="text-destructive"
      >
        {{ $t('general.max') }} 10
      </span>
    </FormKit>
  </FormKit>
</template>
