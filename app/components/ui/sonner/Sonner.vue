<script lang="ts" setup>
import type { ToasterProps } from 'vue-sonner'
import { reactiveOmit } from '@vueuse/core'
import { Toaster as Sonner } from 'vue-sonner'

const props = defineProps<ToasterProps>()
const delegatedProps = reactiveOmit(props, 'toastOptions')
const colorMode = useColorMode()

function tint(color: string): string {
  return `color-mix(in oklab, var(--${color}) 50%, transparent)`
}
</script>

<template>
  <Sonner
    v-bind="delegatedProps"
    class="toaster group"
    :theme="colorMode.value === 'dark' ? 'dark' : 'light'"
    rich-colors
    :style="{
      '--normal-bg': tint('muted-foreground'),
      '--normal-border': 'var(--muted-foreground)',
      '--normal-text': 'var(--foreground)',
      '--success-bg': tint('success'),
      '--success-border': 'var(--success)',
      '--success-text': 'var(--foreground)',
      '--info-bg': tint('info'),
      '--info-border': 'var(--info)',
      '--info-text': 'var(--foreground)',
      '--warning-bg': tint('warning'),
      '--warning-border': 'var(--warning)',
      '--warning-text': 'var(--foreground)',
      '--error-bg': tint('destructive'),
      '--error-border': 'var(--destructive)',
      '--error-text': 'var(--foreground)',
      '--border-radius': 'var(--radius)',
    }"
    :toast-options="{
      classes: {
        toast: 'border-4! backdrop-blur-xl',
        title: 'font-semibold!',
        actionButton: 'bg-foreground! text-background!',
        cancelButton: 'bg-muted! text-muted-foreground!',
      },
    }"
  >
    <template #success-icon>
      <Icon name="tabler:circle-check" class="size-4" aria-hidden="true" />
    </template>
    <template #info-icon>
      <Icon name="tabler:info-circle" class="size-4" aria-hidden="true" />
    </template>
    <template #warning-icon>
      <Icon name="tabler:alert-triangle" class="size-4" aria-hidden="true" />
    </template>
    <template #error-icon>
      <Icon name="tabler:mood-sad" class="size-4" aria-hidden="true" />
    </template>
    <template #loading-icon>
      <Icon
        name="tabler:loader-2"
        class="size-4 animate-spin"
        aria-hidden="true"
      />
    </template>
    <template #close-icon>
      <Icon name="tabler:x" class="size-4" aria-hidden="true" />
    </template>
  </Sonner>
</template>
