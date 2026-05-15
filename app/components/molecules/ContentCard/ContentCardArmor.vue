<script setup lang="ts">
defineProps<{ content: DndArmor }>()
</script>

<template>
  <div class="text-sm">
    <p
      v-if="content.type"
      class="mt-1 text-muted-foreground"
    >
      <span class="font-bold text-foreground">Category:</span> {{ content.type }}
    </p>
    <p
      v-if="content.acDisplay"
      class="mt-1 text-muted-foreground"
    >
      <span class="font-bold text-foreground">Armor Class:</span> {{ content.acDisplay }}
    </p>
    <p
      v-if="content.acBase !== undefined"
      class="mt-1 text-muted-foreground"
    >
      <span class="font-bold text-foreground">Base AC:</span> {{ content.acBase }}
    </p>
    <p
      v-if="content.strengthScoreRequired"
      class="mt-1 text-muted-foreground"
    >
      <span class="font-bold text-foreground">Strength Required:</span> {{ content.strengthScoreRequired }}
    </p>
    <p
      v-if="content.grantsStealthDisadvantage !== undefined"
      class="mt-1 text-muted-foreground"
    >
      <span class="font-bold text-foreground">Stealth Disadvantage:</span> {{ content.grantsStealthDisadvantage ? $t('general.yes') : $t('general.no') }}
    </p>
  </div>
</template>
