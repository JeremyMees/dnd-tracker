<script setup lang="ts">
import { ModalFeatureRequest, ModalBadge } from '#components'

const { modals, remove } = useModal()

const modalComponents: Record<ModalComponent, any> = {
  FeatureRequest: ModalFeatureRequest,
  Badge: ModalBadge,
}
</script>

<template>
  <Modal
    v-for="{ uuid, header, component, props } in modals"
    :key="uuid"
    open
    @close="remove(uuid)"
  >
    <template #header>
      <h2>
        {{ header }}
      </h2>
    </template>
    <component
      :is="modalComponents[component]"
      v-bind="props"
    />
  </Modal>
</template>
