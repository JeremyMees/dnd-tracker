<script setup lang="ts">
defineProps<{ campaign?: boolean }>()
</script>

<template>
  <UiCard class="border-background bg-background/50">
    <UiCardHeader>
      <UiCardTitle>
        {{ $t('components.initiativeTable.emptyState.title') }}
      </UiCardTitle>
      <UiCardDescription>
        {{ $t('components.initiativeTable.emptyState.text') }}
      </UiCardDescription>
    </UiCardHeader>
    <UiCardContent class="flex flex-col gap-4">
      <div>
        <div class="flex items-center gap-2">
          <Icon
            name="tabler:bat"
            class="size-4 min-w-4 text-destructive"
            aria-hidden="true"
          />
          <span>{{ $t('general.bestiary') }}</span>
        </div>
        <p class="text-muted-foreground">
          {{ $t('components.initiativeTable.emptyState.bestiary') }}
        </p>
      </div>
      <div v-if="campaign">
        <div class="flex items-center gap-2">
          <Icon
            name="tabler:meeple"
            class="size-4 min-w-4 text-primary"
            aria-hidden="true"
          />
          <span>{{ $t('general.campaignHomebrew') }}</span>
        </div>
        <p class="text-muted-foreground">
          {{ $t('components.initiativeTable.emptyState.campaignHomebrew') }}
        </p>
      </div>
      <div>
        <div class="flex items-center gap-2">
          <Icon
            name="tabler:beer"
            class="size-4 min-w-4 text-warning"
            aria-hidden="true"
          />
          <span>{{ $t('general.newHomebrew') }}</span>
        </div>
        <p class="text-muted-foreground">
          {{ $t('components.initiativeTable.emptyState.newHomebrew') }}
        </p>
      </div>
    </UiCardContent>
  </UiCard>
</template>
