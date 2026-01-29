<script setup lang="ts">
defineProps<{
  content: Open5eSpell
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
        v-if="content.level"
        class="mt-1 text-muted-foreground"
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
        v-if="content.school"
        class="mt-1 text-muted-foreground"
      >
        <span class="font-bold text-foreground">School:</span> {{ content.school.name }}
      </p>
      <p
        v-if="content.classes?.length"
        class="mt-1 text-muted-foreground"
      >
        <span class="font-bold text-foreground">Classes:</span> {{ content.classes.map(c => c.name).join(', ') }}
      </p>

      <UiSeparator
        v-if="
          content.casting_time
            || content.range_text
            || content.verbal
            || content.somatic
            || content.material
            || content.ritual
            || content.duration
            || content.concentration"
        class="my-2"
      />

      <p
        v-if="content.casting_time"
        class="mt-1 text-muted-foreground"
      >
        <span class="font-bold text-foreground">Casting time:</span> {{ content.casting_time }}
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
        <span class="font-bold text-foreground">Concentration:</span> Yes
      </p>
      <p
        v-if="content.range_text"
        class="mt-1 text-muted-foreground"
      >
        <span class="font-bold text-foreground">Range:</span> {{ content.range_text }}
      </p>
      <p
        v-if="content.verbal || content.somatic || content.material"
        class="mt-1 text-muted-foreground"
      >
        <span class="font-bold text-foreground">Components:</span> {{ [content.verbal ? 'V' : '', content.somatic ? 'S' : '', content.material ? 'M' : ''].filter(Boolean).join(', ') }}{{ content.material_specified ? ` (${content.material_specified})` : '' }}
      </p>
      <p
        v-if="content.ritual"
        class="mt-1 text-muted-foreground"
      >
        <span class="font-bold text-foreground">Ritual:</span> {{ $t('general.yes') }}
      </p>

      <UiSeparator
        v-if="
          content.target_type
            || content.target_count
            || content.shape_type
            || content.shape_size"
        class="my-2"
      />

      <p
        v-if="content.target_type"
        class="mt-1 text-muted-foreground"
      >
        <span class="font-bold text-foreground">Target type:</span> {{ content.target_type }}
      </p>
      <p
        v-if="content.target_count"
        class="mt-1 text-muted-foreground"
      >
        <span class="font-bold text-foreground">Target count:</span> {{ content.target_count }}
      </p>
      <p
        v-if="content.shape_type"
        class="mt-1 text-muted-foreground"
      >
        <span class="font-bold text-foreground">Shape type:</span> {{ content.shape_type }}
      </p>
      <p
        v-if="content.shape_size"
        class="mt-1 text-muted-foreground"
      >
        <span class="font-bold text-foreground">Shape size:</span> {{ content.shape_size }}
      </p>

      <UiSeparator
        v-if="
          content.attack_roll !== undefined
            || content.damage_roll
            || (content.damage_types && content.damage_types.length)
            || content.saving_throw_ability"
        class="my-2"
      />

      <p
        v-if="content.attack_roll !== undefined"
        class="mt-1 text-muted-foreground"
      >
        <span class="font-bold text-foreground">Attack roll:</span> {{ content.attack_roll ? $t('general.yes') : $t('general.no') }}
      </p>
      <p
        v-if="content.damage_roll"
        class="mt-1 text-muted-foreground"
      >
        <span class="font-bold text-foreground">Damage roll:</span> {{ content.damage_roll }}
      </p>
      <p
        v-if="content.damage_types?.length"
        class="mt-1 text-muted-foreground"
      >
        <span class="font-bold text-foreground">Damage types:</span> {{ content.damage_types.join(', ') }}
      </p>
      <p
        v-if="content.saving_throw_ability"
        class="mt-1 text-muted-foreground"
      >
        <span class="font-bold text-foreground">Saving throw:</span> {{ content.saving_throw_ability }}
      </p>

      <UiSeparator
        v-if="
          content.reaction_condition
            || content.material_cost
            || content.material_consumed !== undefined"
        class="my-2"
      />

      <p
        v-if="content.reaction_condition"
        class="mt-1 text-muted-foreground"
      >
        <span class="font-bold text-foreground">Reaction condition:</span> {{ content.reaction_condition }}
      </p>
      <p
        v-if="content.material_cost"
        class="mt-1 text-muted-foreground"
      >
        <span class="font-bold text-foreground">Material cost:</span> {{ content.material_cost }}
      </p>
      <p
        v-if="content.material_consumed !== undefined"
        class="mt-1 text-muted-foreground"
      >
        <span class="font-bold text-foreground">Material consumed:</span> {{ content.material_consumed ? $t('general.yes') : $t('general.no') }}
      </p>
    </template>
  </div>
</template>
