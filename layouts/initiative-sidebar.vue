<script setup lang="ts">
import type { Sidebar } from '#components'

defineEmits<{
  openSearch: []
  openDiceRolling: []
  openBestiary: []
  openCampaignHomebrew: []
  openNewHomebrew: []
  openSettings: []
}>()

defineProps<{
  title: string
  campaign?: CampaignMinimal
}>()

const sidebar = ref<InstanceType<typeof Sidebar>>()
</script>

<template>
  <Sidebar ref="sidebar">
    <template #sidebar-header>
      <h1>
        {{ title }}
      </h1>
    </template>

    <template #sidebar-content>
      <ul class="space-y-2 font-bold body-small">
        <li>
          <SidebarItem
            :label="$t('general.info')"
            icon="tabler:search"
            :minimized="!!sidebar?.isMinimized"
            color="success"
            @click="() => {
              if (sidebar?.isOpen) sidebar.isOpen = false
              $emit('openSearch')
            }"
          />
        </li>
        <li>
          <SidebarItem
            :label="$t('actions.roll')"
            icon="tabler:hexagon"
            :minimized="!!sidebar?.isMinimized"
            color="secondary"
            @click="() => {
              if (sidebar?.isOpen) sidebar.isOpen = false
              $emit('openDiceRolling')
            }"
          />
        </li>
        <li>
          <SidebarItem
            :label="$t('general.bestiary')"
            icon="tabler:bat"
            :minimized="!!sidebar?.isMinimized"
            color="danger"
            @click="() => {
              if (sidebar?.isOpen) sidebar.isOpen = false
              $emit('openBestiary')
            }"
          />
        </li>
        <li>
          <SidebarItem
            :label="$t('general.campaignHomebrew')"
            icon="tabler:meeple"
            :minimized="!!sidebar?.isMinimized"
            color="primary"
            @click="() => {
              if (sidebar?.isOpen) sidebar.isOpen = false
              $emit('openCampaignHomebrew')
            }"
          />
        </li>
        <li>
          <SidebarItem
            :label="$t('general.newHomebrew')"
            icon="tabler:beer"
            :minimized="!!sidebar?.isMinimized"
            color="warning"
            @click="() => {
              if (sidebar?.isOpen) sidebar.isOpen = false
              $emit('openNewHomebrew')
            }"
          />
        </li>
        <hr class="border-t-slate-700">
        <li>
          <SidebarItem
            id="tour-13"
            :label="$t('general.setting', 2)"
            icon="tabler:settings"
            :minimized="!!sidebar?.isMinimized"
            @click="() => {
              if (sidebar?.isOpen) sidebar.isOpen = false
              $emit('openSettings')
            }"
          />
        </li>
        <li>
          <SidebarItem
            :label="$t('general.encounter', 2)"
            icon="tabler:list-details"
            :minimized="!!sidebar?.isMinimized"
            url="encounters"
          />
        </li>
        <li v-if="campaign">
          <SidebarItem
            :label="$t('general.campaign')"
            icon="tabler:layout-dashboard"
            :minimized="!!sidebar?.isMinimized"
            :url="campaignUrl(campaign, 'encounters')"
          />
        </li>
        <li>
          <SidebarItem
            :label="$t('general.hotkey', 2)"
            icon="tabler:keyboard"
            :minimized="!!sidebar?.isMinimized"
            @click="() => {
              if (sidebar?.isOpen) sidebar.isOpen = false
            }"
          />
        </li>
      </ul>
    </template>

    <slot />
  </Sidebar>
</template>
