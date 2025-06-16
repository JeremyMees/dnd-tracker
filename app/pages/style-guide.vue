<script setup lang="ts">
definePageMeta({
  middleware: () => {
    if (!import.meta.dev) return navigateTo('/')
  },
})
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
        <div class="flex gap-4 items-center">
          <button class="btn-primary w-[200px]">
            Primary
          </button>
          <button class="icon-btn-primary">
            <Icon name="tabler:sword" />
          </button>
        </div>
        <div class="flex gap-4 items-center">
          <button class="btn-secondary w-[200px]">
            Secondary
          </button>
          <button class="icon-btn-secondary">
            <Icon name="tabler:sword" />
          </button>
        </div>
        <div class="flex gap-4 items-center">
          <button class="btn-tertiary w-[200px]">
            Tertiary
          </button>
          <button class="icon-btn-tertiary">
            <Icon name="tabler:sword" />
          </button>
        </div>
        <div class="flex gap-4 items-center">
          <button class="btn-success w-[200px]">
            Success
          </button>
          <button class="icon-btn-success">
            <Icon name="tabler:sword" />
          </button>
        </div>
        <div class="flex gap-4 items-center">
          <button class="btn-info w-[200px]">
            Info
          </button>
          <button class="icon-btn-info">
            <Icon name="tabler:sword" />
          </button>
        </div>
        <div class="flex gap-4 items-center">
          <button class="btn-warning w-[200px]">
            Warning
          </button>
          <button class="icon-btn-warning">
            <Icon name="tabler:sword" />
          </button>
        </div>
        <div class="flex gap-4 items-center">
          <button class="btn-help w-[200px]">
            Help
          </button>
          <button class="icon-btn-help">
            <Icon name="tabler:sword" />
          </button>
        </div>
        <div class="flex gap-4 items-center">
          <button class="btn-destructive w-[200px]">
            Destructive
          </button>
          <button class="icon-btn-destructive">
            <Icon name="tabler:sword" />
          </button>
        </div>
        <div class="flex gap-4 items-center">
          <button class="btn-foreground w-[200px]">
            Foreground
          </button>
          <button class="icon-btn-foreground">
            <Icon name="tabler:sword" />
          </button>
        </div>
        <div class="flex gap-4 items-center">
          <button class="btn-background w-[200px]">
            Background
          </button>
          <button class="icon-btn-background">
            <Icon name="tabler:sword" />
          </button>
        </div>
        <div class="flex gap-4 items-center">
          <button class="btn-ghost w-[200px]">
            Ghost
          </button>
          <button class="icon-btn-ghost">
            <Icon name="tabler:sword" />
          </button>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
