<script setup lang="ts">
const {
  showPopup,
  consents,
  consentTypes,
  toggleConsent,
  acceptAll,
  rejectAll,
  savePreferences,
} = useConsent()

const showSettings = ref(false)
</script>

<template>
  <div
    v-if="showPopup"
    tabindex="0"
    :aria-label="$t('components.ConsentBanner.banner.title')"
    aria-modal="true"
    role="dialog"
    :data-state="showPopup ? 'open' : 'closed'"
    data-test-banner
    class="fixed border-4 border-muted bg-background shadow-lg z-50 md:w-md overflow-hidden rounded-2xl right-4 left-4 bottom-4 p-4 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom"
  >
    <div
      v-if="!showSettings"
      data-test-banner-info
      class="flex flex-col gap-6"
    >
      <div class="flex flex-col gap-1">
        <p class="font-bold">
          {{ $t('components.ConsentBanner.banner.title') }}
        </p>
        <p class="text-muted-foreground text-sm">
          {{ $t('components.ConsentBanner.banner.text') }}
        </p>
      </div>
      <div class="flex flex-col md:flex-row justify-between gap-2">
        <div class="flex flex-row gap-2">
          <UiButton
            data-test-reject-all
            variant="secondary"
            class="w-full md:w-fit"
            @click="rejectAll"
          >
            {{ $t('components.ConsentBanner.rejectAll') }}
          </UiButton>
          <UiButton
            data-test-accept-all
            variant="secondary"
            class="w-full md:w-fit"
            @click="acceptAll"
          >
            {{ $t('components.ConsentBanner.acceptAll') }}
          </UiButton>
        </div>
        <UiButton
          data-test-customize
          variant="tertiary"
          @click="showSettings = true"
        >
          {{ $t('components.ConsentBanner.customize') }}
        </UiButton>
      </div>
    </div>

    <div
      v-else
      data-test-banner-settings
      class="flex flex-col gap-6"
    >
      <div class="flex flex-col gap-1">
        <p class="font-bold">
          {{ $t('components.ConsentBanner.settings.title') }}
        </p>
        <p class="text-muted-foreground text-sm">
          {{ $t('components.ConsentBanner.settings.text') }}
        </p>
      </div>

      <div class="flex flex-col gap-2">
        <div
          v-for="type in consentTypes"
          :key="type"
          class="border rounded-lg p-4 flex flex-col gap-2"
        >
          <div class="flex items-center justify-between">
            <UiLabel :for="type">
              {{ $t(`components.ConsentBanner.${type}`) }}
            </UiLabel>
            <UiSwitch
              :id="type"
              :checked="consents?.[type] || false"
              :default-value="consents?.[type] || false"
              :disabled="type === 'necessary'"
              @update:model-value="() => {
                console.log('toggling consent for', type)
                toggleConsent(type)
              }"
            />
          </div>
          <p class="text-sm text-muted-foreground">
            {{ $t(`components.ConsentBanner.${type}Text`) }}
          </p>
        </div>
      </div>

      <div class="flex flex-col md:flex-row justify-between gap-2">
        <div class="flex flex-row gap-2">
          <UiButton
            data-test-reject-all
            class="w-full md:w-fit"
            variant="secondary"
            @click="rejectAll"
          >
            {{ $t('components.ConsentBanner.rejectAll') }}
          </UiButton>
          <UiButton
            data-test-accept-all
            class="w-full md:w-fit"
            variant="secondary"
            @click="acceptAll"
          >
            {{ $t('components.ConsentBanner.acceptAll') }}
          </UiButton>
        </div>
        <UiButton
          data-test-save-preferences
          variant="tertiary"
          @click="savePreferences"
        >
          {{ $t('components.ConsentBanner.saveSettings') }}
        </UiButton>
      </div>
    </div>
  </div>
</template>
