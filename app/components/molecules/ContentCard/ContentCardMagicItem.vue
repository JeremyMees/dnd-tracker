<script setup lang="ts">
defineProps<{
  content: Open5eMagicItem
  isOpen: boolean
}>()
</script>

<template>
  <div class="text-sm">
    <div
      v-if="content.desc"
      v-dompurify-html="$md.render(content.desc)"
      class="md-richtext text-muted-foreground"
      :class="{
        'line-clamp-3': !isOpen,
      }"
    />
    <UiSeparator
      v-if="isOpen"
      data-test-separator
      class="my-2"
    />
    <template v-if="isOpen">
      <p
        v-if="content.category"
        class="mt-1 text-muted-foreground"
      >
        <span class="font-bold text-foreground">Category:</span> {{ content.category.name }}
      </p>
      <p
        v-if="content.rarity"
        class="mt-1 text-muted-foreground"
      >
        <span class="font-bold text-foreground">Rarity:</span> {{ content.rarity.name }}
      </p>
      <p
        v-if="content.size"
        class="mt-1 text-muted-foreground"
      >
        <span class="font-bold text-foreground">Size:</span> {{ content.size.name }}
      </p>
      <p
        v-if="content.weight"
        class="mt-1 text-muted-foreground"
      >
        <span class="font-bold text-foreground">Weight:</span> {{ content.weight }} {{ content.weight_unit }}
      </p>
      <p
        v-if="content.cost"
        class="mt-1 text-muted-foreground"
      >
        <span class="font-bold text-foreground">Cost:</span> {{ content.cost }}
      </p>
      <p
        v-if="content.requires_attunement !== undefined"
        class="mt-1 text-muted-foreground"
      >
        <span class="font-bold text-foreground">Requires Attunement:</span> {{ content.requires_attunement ? 'Yes' : 'No' }}
      </p>
      <p
        v-if="content.attunement_detail"
        class="mt-1 text-muted-foreground"
      >
        <span class="font-bold text-foreground">Attunement Detail:</span> {{ content.attunement_detail }}
      </p>

      <template v-if="content.armor">
        <UiSeparator class="my-2" />

        <p class="mt-1 text-muted-foreground">
          <span class="font-bold text-foreground">Armor Class:</span> {{ content.armor.ac_display }}
        </p>
        <p class="mt-1 text-muted-foreground">
          <span class="font-bold text-foreground">Armor Category:</span> {{ content.armor.category }}
        </p>
        <p
          v-if="content.armor.ac_base"
          class="mt-1 text-muted-foreground"
        >
          <span class="font-bold text-foreground">Base AC:</span> {{ content.armor.ac_base }}
        </p>
        <p
          v-if="content.armor.grants_stealth_disadvantage !== undefined"
          class="mt-1 text-muted-foreground"
        >
          <span class="font-bold text-foreground">Stealth Disadvantage:</span> {{ content.armor.grants_stealth_disadvantage ? 'Yes' : 'No' }}
        </p>
        <p
          v-if="content.armor.strength_score_required"
          class="mt-1 text-muted-foreground"
        >
          <span class="font-bold text-foreground">Strength Required:</span> {{ content.armor.strength_score_required }}
        </p>
      </template>
    </template>
  </div>
</template>
