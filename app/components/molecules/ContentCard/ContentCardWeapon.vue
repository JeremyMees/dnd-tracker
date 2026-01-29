<script setup lang="ts">
defineProps<{
  content: Open5eWeapon
  isOpen: boolean
}>()
</script>

<template>
  <div class="text-sm">
    <p
      v-if="content.damage_dice"
      class="mt-1 text-muted-foreground"
    >
      <span class="font-bold text-foreground">Damage:</span> {{ content.damage_dice }}
      <span v-if="content.damage_type">({{ content.damage_type.name }})</span>
    </p>
    <p
      v-if="content.range !== undefined"
      class="mt-1 text-muted-foreground"
    >
      <span class="font-bold text-foreground">Range:</span>
      {{ content.range }}{{ content.long_range ? `/${content.long_range}` : '' }}
      <span
        v-if="content.distance_unit"
        class="ml-0.5"
      >{{ content.distance_unit }}</span>
    </p>
    <p
      v-if="content.is_simple !== undefined"
      class="mt-1 text-muted-foreground"
    >
      <span class="font-bold text-foreground">Simple Weapon:</span> {{ content.is_simple ? 'Yes' : 'No' }}
    </p>
    <p
      v-if="content.is_improvised !== undefined"
      class="mt-1 text-muted-foreground"
    >
      <span class="font-bold text-foreground">Improvised:</span> {{ content.is_improvised ? 'Yes' : 'No' }}
    </p>

    <template v-if="isOpen">
      <UiSeparator
        data-test-separator
        class="my-2"
      />

      <ul
        v-if="content.properties?.length"
        class="mt-1 list-disc list-outside ml-5"
      >
        <li
          v-for="(prop, index) in content.properties"
          :key="index"
          class="mt-0.5"
        >
          <strong>{{ prop.property.name }}</strong>:
          <span class="text-muted-foreground">
            {{ prop.property.desc }}
          </span>
          <div
            v-if="prop.detail"
            class="text-muted-foreground"
          >
            {{ prop.detail }}
          </div>
        </li>
      </ul>
    </template>
  </div>
</template>
