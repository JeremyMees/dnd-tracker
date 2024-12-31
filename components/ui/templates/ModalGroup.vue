<script setup lang="ts">
import {
  ModalFeatureRequest,
  ModalBadge,
  ModalCampaign,
  ModalEncounter,
  ModalTransferOwnership,
  ModalInviteMember,
  ModalHomebrew,
  ModalNote,
  ModalMail,
  ModalInitiativeSettings,
} from '#components'

const { modals, close } = useModal()

const modalComponents: Record<ModalComponent, any> = {
  FeatureRequest: ModalFeatureRequest,
  Badge: ModalBadge,
  Campaign: ModalCampaign,
  Encounter: ModalEncounter,
  TransferOwnership: ModalTransferOwnership,
  InviteMember: ModalInviteMember,
  Homebrew: ModalHomebrew,
  Note: ModalNote,
  Mail: ModalMail,
  InitiativeSettings: ModalInitiativeSettings,
}
</script>

<template>
  <Modal
    v-for="{ uuid, header, subHeader, component, props, events } in modals"
    :key="uuid"
    @close="close(uuid)"
  >
    <template #header>
      <h2>
        {{ header }}
      </h2>
      <h4
        v-if="subHeader"
        class="mt-2 text-slate-300 font-bold"
      >
        {{ subHeader }}
      </h4>
    </template>
    <component
      :is="modalComponents[component]"
      v-bind="props"
      v-on="events"
      @close="close(uuid)"
    />
  </Modal>
</template>
