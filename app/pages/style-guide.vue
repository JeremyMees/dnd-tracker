<script setup lang="ts">
import type { ButtonVariants } from '~/components/ui/button'

definePageMeta({
  middleware: () => {
    if (!import.meta.dev) return navigateTo('/')
  },
})

const buttonVariants: ButtonVariants['variant'][] = [
  'default',
  'default-ghost',
  'secondary',
  'secondary-ghost',
  'tertiary',
  'tertiary-ghost',
  'success',
  'success-ghost',
  'info',
  'info-ghost',
  'warning',
  'warning-ghost',
  'help',
  'help-ghost',
  'destructive',
  'destructive-ghost',
  'foreground',
  'foreground-ghost',
  'background',
  'background-ghost',
  'link',
]

const buttonSizes: ButtonVariants['size'][] = [
  'lg',
  'default',
  'sm',
  'icon',
  'icon-sm',
]
</script>

<template>
  <NuxtLayout container>
    <div class="flex flex-wrap gap-x-20 gap-y-10">
      <div class="flex flex-col gap-2">
        <p class="text-6xl pb-4">
          Typography
        </p>
        <h1>
          Heading 1
        </h1>
        <h2>
          Heading 2
        </h2>
        <h3>
          Heading 3
        </h3>
        <h4>
          Heading 4
        </h4>
        <h5>
          Heading 5
        </h5>
        <h6>
          Heading 6
        </h6>
        <p class="text-base">
          Normal text
        </p>
        <p class="text-sm">
          Small text
        </p>
        <p class="text-2xs">
          Extra small text
        </p>
      </div>
      <div class="flex flex-col gap-2">
        <p class="text-6xl pb-4">
          Colors
        </p>
        <div class="flex gap-2 items-center">
          <div class="size-8 bg-foreground rounded border" />
          <span>Foreground</span>
        </div>
        <div class="flex gap-2 items-center">
          <div class="size-8 bg-background rounded border" />
          <span>Background</span>
        </div>
        <div class="flex gap-2 items-center">
          <div class="size-8 bg-muted rounded border" />
          <span>Muted</span>
        </div>
        <div class="flex gap-2 items-center">
          <div class="size-8 bg-muted-foreground rounded border" />
          <span>Muted foreground</span>
        </div>
        <div class="flex gap-2 items-center">
          <div class="size-8 bg-primary rounded border" />
          <span>Primary</span>
        </div>
        <div class="flex gap-2 items-center">
          <div class="size-8 bg-secondary rounded border" />
          <span>Secondary</span>
        </div>
        <div class="flex gap-2 items-center">
          <div class="size-8 bg-tertiary rounded border" />
          <span>Tertiary</span>
        </div>
        <div class="flex gap-2 items-center">
          <div class="size-8 bg-success rounded border" />
          <span>Success</span>
        </div>
        <div class="flex gap-2 items-center">
          <div class="size-8 bg-info rounded border" />
          <span>Info</span>
        </div>
        <div class="flex gap-2 items-center">
          <div class="size-8 bg-warning rounded border" />
          <span>Warning</span>
        </div>
        <div class="flex gap-2 items-center">
          <div class="size-8 bg-help rounded border" />
          <span>Help</span>
        </div>
        <div class="flex gap-2 items-center">
          <div class="size-8 bg-destructive rounded border" />
          <span>Destructive</span>
        </div>
        <div class="flex gap-2 items-center">
          <div class="size-8 bg-accent rounded border" />
          <span>Accent</span>
        </div>
      </div>
      <div class="flex flex-col gap-2">
        <p class="text-6xl pb-4">
          Buttons
        </p>
        <div
          v-for="(variant, i) in buttonVariants"
          :key="i"
          class="flex gap-4 items-center"
        >
          <UiButton
            v-for="(size, j) in buttonSizes"
            :key="`${i}-size-${j}`"
            :variant="variant"
            :size="size"
          >
            <Icon
              v-if="size?.includes('icon')"
              name="tabler:sword"
            />
            <span v-else>
              {{ variant }}
            </span>
          </UiButton>
          <!-- <UiButton
            size="icon"
            :variant="variant"
          >
            <Icon name="tabler:sword" />
          </UiButton>
          <UiButton
            size="icon-sm"
            :variant="variant"
          >
            <Icon name="tabler:sword" />
          </UiButton> -->
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
