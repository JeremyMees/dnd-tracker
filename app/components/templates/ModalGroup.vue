<script setup lang="ts">
import {
  LazyModalFeatureRequest,
  LazyModalCampaign,
  LazyModalEncounter,
  LazyModalTransferOwnership,
  LazyModalInviteMember,
  LazyModalHomebrew,
  LazyModalNote,
  LazyModalMail,
} from '#components'

const { modals, close } = useModal()

const modalComponents: Record<ModalComponent, any> = {
  FeatureRequest: LazyModalFeatureRequest,
  Campaign: LazyModalCampaign,
  Encounter: LazyModalEncounter,
  TransferOwnership: LazyModalTransferOwnership,
  InviteMember: LazyModalInviteMember,
  Homebrew: LazyModalHomebrew,
  Note: LazyModalNote,
  Mail: LazyModalMail,
}
</script>

<template>
  <Modal
    v-for="modal in modals"
    :key="modal.uuid"
    :header="modal.header"
    :sub-header="modal.subHeader"
    :variant="modal.variant"
    @close="close(modal.uuid)"
  >
    <component
      :is="modalComponents[modal.component]"
      v-bind="modal.props"
      v-on="modal.events"
      @close="close(modal.uuid)"
    />
  </Modal>
</template>
