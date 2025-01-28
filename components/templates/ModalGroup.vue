<script setup lang="ts">
import {
  LazyModalFeatureRequest,
  LazyModalBadge,
  LazyModalCampaign,
  LazyModalEncounter,
  LazyModalTransferOwnership,
  LazyModalInviteMember,
  LazyModalHomebrew,
  LazyModalNote,
  LazyModalMail,
  LazyInitiativeModalSettings,
  LazyInitiativeModalRowName,
  LazyInitiativeModalRowInit,
  LazyInitiativeModalRowHealth,
  LazyInitiativeModalRowAc,
  LazyModalDiceRoll,
} from '#components'

const { modals, close } = useModal()

const modalComponents: Record<ModalComponent, any> = {
  FeatureRequest: LazyModalFeatureRequest,
  Badge: LazyModalBadge,
  Campaign: LazyModalCampaign,
  Encounter: LazyModalEncounter,
  TransferOwnership: LazyModalTransferOwnership,
  InviteMember: LazyModalInviteMember,
  Homebrew: LazyModalHomebrew,
  Note: LazyModalNote,
  Mail: LazyModalMail,
  InitiativeSettings: LazyInitiativeModalSettings,
  InitiativeRowName: LazyInitiativeModalRowName,
  InitiativeRowInit: LazyInitiativeModalRowInit,
  InitiativeRowHealth: LazyInitiativeModalRowHealth,
  InitiativeRowAc: LazyInitiativeModalRowAc,
  DiceRoll: LazyModalDiceRoll,
}
</script>

<template>
  <ClientOnly>
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
          class="btn-black w-full"
        >
          {{ modal.submit }}
        </button>
      </template>
    </Modal>
  </ClientOnly>
</template>
