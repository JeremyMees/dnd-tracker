<script setup lang="ts">
defineProps<{
  content: DndWeapon
  isOpen: boolean
}>()
</script>

<template>
  <div class="text-sm">
    <p
      v-if="content.damageDice"
      class="mt-1 text-muted-foreground"
    >
      <span class="font-bold text-foreground">Damage:</span> {{ content.damageDice }}
      <span v-if="content.damageType">({{ content.damageType }})</span>
    </p>
    <p
      v-if="content.range !== undefined"
      class="mt-1 text-muted-foreground"
    >
      <span class="font-bold text-foreground">Range:</span>
      {{ content.range }}{{ content.longRange ? `/${content.longRange}` : '' }}
      <span
        v-if="content.distanceUnit"
        class="ml-0.5"
      >{{ content.distanceUnit }}</span>
    </p>
    <p
      v-if="content.isSimple !== undefined"
      class="mt-1 text-muted-foreground"
    >
      <span class="font-bold text-foreground">Simple Weapon:</span> {{ content.isSimple ? 'Yes' : 'No' }}
    </p>
    <p
      v-if="content.isImprovised !== undefined"
      class="mt-1 text-muted-foreground"
    >
      <span class="font-bold text-foreground">Improvised:</span> {{ content.isImprovised ? 'Yes' : 'No' }}
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
