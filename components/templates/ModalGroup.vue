<script setup lang="ts">
import {
  LazyModalFeatureRequest,
  LazyModalCampaign,
  LazyModalEncounter,
  LazyModalTransferOwnership,
  LazyModalInviteMember,
  LazyModalHomebrew,
  ModalNote,
  LazyModalMail,
  LazyInitiativeModalSettings,
} from '#components'

const { modals, close } = useModal()

const modalComponents: Record<ModalComponent, any> = {
  FeatureRequest: LazyModalFeatureRequest,
  Campaign: LazyModalCampaign,
  Encounter: LazyModalEncounter,
  TransferOwnership: LazyModalTransferOwnership,
  InviteMember: LazyModalInviteMember,
  Homebrew: LazyModalHomebrew,
  Note: ModalNote,
  Mail: LazyModalMail,
  InitiativeSettings: LazyInitiativeModalSettings,
}
</script>

<template>
  <Modal
    v-for="modal in modals"
    :key="modal.uuid"
    :header="modal.header"
    :sub-header="modal.subHeader"
    :big="modal.big"
    @close="close(modal.uuid)"
  >
    <component
      :is="modalComponents[modal.component]"
      v-bind="modal.props"
      v-on="modal.events"
      @close="close(modal.uuid)"
    />

    <template
      v-if="modal.submit"
      #footer
    >
      <button
        type="submit"
        :form="modal.component"
        class="btn-foreground w-full"
      >
        {{ modal.submit }}
      </button>
    </template>
  </Modal>
</template>
