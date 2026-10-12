<script setup lang="ts">
defineProps<{ type: 'menu' | 'footer' }>()

const { t } = useI18n()
const modal = useModal()

function openBugReport(): void {
  modal.open({
    component: 'BugReport',
    header: t('components.bugReportModal.title'),
  })
}
</script>

<template>
  <button
    test-id="bug-report"
    class="flex items-center"
    :class="{
      'gap-2 w-full cursor-pointer': type === 'menu',
      'text-sm': type === 'footer',
    }"
    @click="openBugReport"
  >
    <Icon
      name="tabler:bug"
      class="size-4 min-w-4"
      :class="{
        'mr-2 text-muted-foreground': type === 'footer',
      }"
    />
    {{ $t('components.navbar.bug') }}
  </button>
</template>
