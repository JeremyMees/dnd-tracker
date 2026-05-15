<script setup lang="ts">
defineProps<{
  content: DndMagicItem
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
        v-if="content.type"
        class="mt-1 text-muted-foreground"
      >
        <span class="font-bold text-foreground">Category:</span> {{ content.type }}
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
        <span class="font-bold text-foreground">Size:</span> {{ content.size }}
      </p>
      <p
        v-if="content.weight"
        class="mt-1 text-muted-foreground"
      >
        <span class="font-bold text-foreground">Weight:</span> {{ content.weight }} {{ content.weightUnit }}
      </p>
      <p
        v-if="content.cost"
        class="mt-1 text-muted-foreground"
      >
        <span class="font-bold text-foreground">Cost:</span> {{ content.cost }}
      </p>
      <p
        v-if="content.requiresAttunement !== undefined"
        class="mt-1 text-muted-foreground"
      >
        <span class="font-bold text-foreground">Requires Attunement:</span> {{ content.requiresAttunement ? 'Yes' : 'No' }}
      </p>
      <p
        v-if="content.attunementDetail"
        class="mt-1 text-muted-foreground"
      >
        <span class="font-bold text-foreground">Attunement Detail:</span> {{ content.attunementDetail }}
      </p>

      <template v-if="content.armor">
        <UiSeparator class="my-2" />

        <p class="mt-1 text-muted-foreground">
          <span class="font-bold text-foreground">Armor Class:</span> {{ content.armor.acDisplay }}
        </p>
        <p class="mt-1 text-muted-foreground">
          <span class="font-bold text-foreground">Armor Category:</span> {{ content.armor.type }}
        </p>
        <p
          v-if="content.armor.acBase"
          class="mt-1 text-muted-foreground"
        >
          <span class="font-bold text-foreground">Base AC:</span> {{ content.armor.acBase }}
        </p>
        <p
          v-if="content.armor.grantsStealthDisadvantage !== undefined"
          class="mt-1 text-muted-foreground"
        >
          <span class="font-bold text-foreground">Stealth Disadvantage:</span> {{ content.armor.grantsStealthDisadvantage ? 'Yes' : 'No' }}
        </p>
        <p
          v-if="content.armor.strengthScoreRequired"
          class="mt-1 text-muted-foreground"
        >
          <span class="font-bold text-foreground">Strength Required:</span> {{ content.armor.strengthScoreRequired }}
        </p>
      </template>
    </template>
  </div>
</template>
