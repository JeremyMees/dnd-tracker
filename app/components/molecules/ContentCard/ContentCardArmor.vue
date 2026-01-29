<script setup lang="ts">
defineProps<{ content: Open5eArmor }>()
</script>

<template>
  <div class="text-sm">
    <p
      v-if="content.category"
      class="mt-1 text-muted-foreground"
    >
      <span class="font-bold text-foreground">Category:</span> {{ content.category }}
    </p>
    <p
      v-if="content.ac_display"
      class="mt-1 text-muted-foreground"
    >
      <span class="font-bold text-foreground">Armor Class:</span> {{ content.ac_display }}
    </p>
    <p
      v-if="content.ac_base !== undefined"
      class="mt-1 text-muted-foreground"
    >
      <span class="font-bold text-foreground">Base AC:</span> {{ content.ac_base }}
    </p>
    <p
      v-if="content.strength_score_required"
      class="mt-1 text-muted-foreground"
    >
      <span class="font-bold text-foreground">Strength Required:</span> {{ content.strength_score_required }}
    </p>
    <p
      v-if="content.grants_stealth_disadvantage !== undefined"
      class="mt-1 text-muted-foreground"
    >
      <span class="font-bold text-foreground">Stealth Disadvantage:</span> {{ content.grants_stealth_disadvantage ? $t('general.yes') : $t('general.no') }}
    </p>
  </div>
</template>
