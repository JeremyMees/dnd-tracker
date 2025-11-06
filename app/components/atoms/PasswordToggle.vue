<script setup lang="ts">
const isShowing = shallowRef(false)
</script>

<template>
  <UiFormField
    v-slot="{ componentField }"
    name="password"
  >
    <UiFormItem v-auto-animate>
      <UiFormLabel required>
        {{ $t('components.inputs.passwordLabel') }}
      </UiFormLabel>
      <UiFormControl>
        <UiInputGroup>
          <UiInputGroupInput
            :type="isShowing ? 'text' : 'password'"
            v-bind="componentField"
          />
          <UiInputGroupAddon align="inline-end">
            <UiInputGroupButton
              :aria-label="isShowing ? $t('components.inputs.hidePassword') : $t('components.inputs.showPassword')"
              @click="isShowing = !isShowing"
            >
              <Icon :name="isShowing ? 'tabler:eye' : 'tabler:eye-closed'" />
            </UiInputGroupButton>
          </UiInputGroupAddon>
        </UiInputGroup>
      </UiFormControl>
      <UiFormMessage />
    </UiFormItem>
  </UiFormField>
</template>
