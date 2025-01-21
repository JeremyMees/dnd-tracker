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
