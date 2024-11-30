<script setup lang="ts">
import {
  ModalFeatureRequest,
  ModalBadge,
  ModalCampaign,
  ModalEncounter,
  ModalTransferOwnership,
  ModalInviteMember,
} from '#components'

const { modals, close } = useModal()

const modalComponents: Record<ModalComponent, any> = {
  FeatureRequest: ModalFeatureRequest,
  Badge: ModalBadge,
  Campaign: ModalCampaign,
  Encounter: ModalEncounter,
  TransferOwnership: ModalTransferOwnership,
  InviteMember: ModalInviteMember,
}
</script>

<template>
  <Modal
    v-for="{ uuid, header, component, props, events } in modals"
    :key="uuid"
    @close="close(uuid)"
  >
    <template #header>
      <h2>
        {{ header }}
      </h2>
    </template>
    <component
      :is="modalComponents[component]"
      v-bind="props"
      v-on="events"
      @close="close(uuid)"
    />
  </Modal>
</template>
