<script setup lang="ts">
defineProps<{
  content: Open5eItem
  isOpen: boolean
  hideOpenButton: () => boolean
  type: Open5eType
}>()
</script>

<template>
  <div
    v-if="content.desc"
    v-dompurify-html="$md.render(content.desc)"
    class="md-richtext text-muted-foreground"
    :class="{
      'line-clamp-3': !isOpen && hideOpenButton,
      'border-b-4 pb-1 border-background': isOpen && ['spells', 'magicitems'].includes(type),
    }"
  />
  <template v-if="isOpen || hideOpenButton()">
    <p
      v-if="content.category"
      class="mt-4"
    >
      <span class="font-bold text-foreground">Category:</span> {{ content.category }}
    </p>
    <p
      v-if="content.ac_string"
      class="mt-1 text-muted-foreground"
    >
      <span class="font-bold text-foreground">AC:</span> {{ content.ac_string }}
    </p>
    <p
      v-if="content.strength_requirement"
      class="mt-1 text-muted-foreground"
    >
      <span class="font-bold text-foreground">Strength requirement:</span> {{ content.strength_requirement }}
    </p>
    <p
      v-if="content.stealth_disadvantage"
      class="mt-1 text-muted-foreground font-bold"
    >
      Stealth disadvantage
    </p>
    <p
      v-if="content.cost"
      class="mt-1 text-muted-foreground"
    >
      <span class="font-bold text-foreground">Cost:</span> {{ content.cost }}
    </p>
    <p
      v-if="content.damage_dice"
      class="mt-1 text-muted-foreground"
    >
      <span class="font-bold text-foreground">Damage dice:</span> {{ content.damage_dice }}
    </p>
    <p
      v-if="content.damage_type"
      class="mt-1 text-muted-foreground"
    >
      <span class="font-bold text-foreground">Damage type:</span> {{ content.damage_type }}
    </p>
    <p
      v-if="content.weight"
      class="mt-1 text-muted-foreground"
    >
      <span class="font-bold text-foreground">Weight:</span> {{ content.weight }}
    </p>
    <div
      v-if="content.properties"
      class="mt-1 text-muted-foreground"
    >
      <p class="font-bold">
        Properties
      </p>
      <ul class="list-disc list-outside ml-5 mb-5">
        <li
          v-for="property in content.properties"
          :key="property"
        >
          {{ property }}
        </li>
      </ul>
    </div>
    <p
      v-if="content.type"
      class="mt-4"
    >
      <span class="font-bold text-foreground">Type:</span> {{ content.type }}
    </p>
    <p
      v-if="content.rarity"
      class="mt-1 text-muted-foreground"
    >
      <span class="font-bold text-foreground">Rarity:</span> {{ content.rarity }}
    </p>
    <p
      v-if="content.requires_attunement"
      class="mt-1 text-muted-foreground font-bold"
    >
      Requires attunement
    </p>
    <p
      v-if="content.skill_proficiencies"
      class="mt-4"
    >
      <span class="font-bold text-foreground">Skill proficiencies:</span> {{ content.skill_proficiencies }}
    </p>
    <p
      v-if="content.tool_proficiencies"
      class="mt-1 text-muted-foreground"
    >
      <span class="font-bold text-foreground">Tool proficiencies:</span> {{ content.tool_proficiencies }}
    </p>
    <p
      v-if="content.languages"
      class="mt-1 text-muted-foreground"
    >
      <span class="font-bold text-foreground">Languages:</span> {{ content.languages }}
    </p>
    <p
      v-if="content.equipment"
      class="mt-1 text-muted-foreground"
    >
      <span class="font-bold text-foreground">Equipment:</span> {{ content.equipment }}
    </p>
    <p
      v-if="content.feature"
      class="mt-4 font-bold"
    >
      {{ content.feature }}
    </p>
    <p
      v-if="content.feature_desc"
      class="mt-1 text-muted-foreground"
    >
      {{ content.feature_desc }}
    </p>
    <p
      v-if="content.level"
      class="mt-4 text-muted-foreground"
    >
      <span class="font-bold text-foreground">Level:</span> {{ content.level }}
    </p>
    <p
      v-if="content.higher_level"
      class="mt-1 text-muted-foreground"
    >
      <span class="font-bold text-foreground">Higher level:</span> {{ content.higher_level }}
    </p>
    <p
      v-if="content.casting_time"
      class="mt-1 text-muted-foreground"
    >
      <span class="font-bold text-foreground">Casting time:</span> {{ content.casting_time }}
    </p>
    <p
      v-if="content.range"
      class="mt-1 text-muted-foreground"
    >
      <span class="font-bold text-foreground">Range:</span> {{ content.range }}
    </p>
    <p
      v-if="content.duration"
      class="mt-1 text-muted-foreground"
    >
      <span class="font-bold text-foreground">Duration:</span>
      {{ content.duration }}
    </p>
    <p
      v-if="content.concentration"
      class="mt-1 text-muted-foreground"
    >
      <span class="font-bold text-foreground">Concentration:</span>
      {{ content.concentration }}
    </p>
    <p
      v-if="content.ritual"
      class="mt-1 text-muted-foreground"
    >
      <span class="font-bold text-foreground">Ritual:</span>
      {{ content.ritual }}
      <span class="ml-2 text-2xs">can be cast as ritual</span>
    </p>
    <p
      v-if="content.components"
      class="mt-1 text-muted-foreground"
    >
      <span class="font-bold text-foreground">Components:</span> {{ content.components }}
    </p>
    <p
      v-if="content.material"
      class="mt-1 text-muted-foreground"
    >
      <span class="font-bold text-foreground">Material:</span> {{ content.material }}
    </p>
    <p
      v-if="content.school"
      class="mt-1 text-muted-foreground"
    >
      <span class="font-bold text-foreground">School:</span> {{ content.school }}
    </p>
    <p
      v-if="content.dnd_class"
      class="mt-1 text-muted-foreground"
    >
      <span class="font-bold text-foreground">Classes that can use this spell:</span> {{ content.dnd_class }}
    </p>
    <div
      v-if="content.prerequisite"
      class="mt-4"
    >
      <p class="font-bold">
        Prerequisite
      </p>
      <p>
        {{ content.prerequisite }}
      </p>
    </div>
    <div
      v-if="content.effects_desc?.length"
      class="mt-4"
    >
      <p class="font-bold">
        Effects
      </p>
      <ul class="list-disc list-outside ml-5 mb-5">
        <li
          v-for="effect in content.effects_desc"
          :key="effect"
        >
          {{ effect }}
        </li>
      </ul>
    </div>
  </template>
</template>
