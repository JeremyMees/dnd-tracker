<script setup lang="ts">
defineProps<{
  content: DndSpell
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
        v-if="content.higherLevel"
        class="mt-1 text-muted-foreground"
      >
        <span class="font-bold text-foreground">Higher level:</span> {{ content.higherLevel }}
      </p>
      <p
        v-if="content.school"
        class="mt-1 text-muted-foreground"
      >
        <span class="font-bold text-foreground">School:</span> {{ content.school }}
      </p>
      <p
        v-if="content.classes?.length"
        class="mt-1 text-muted-foreground"
      >
        <span class="font-bold text-foreground">Classes:</span> {{ content.classes.join(', ') }}
      </p>

      <UiSeparator
        v-if="
          content.castingTime
            || content.rangeText
            || content.verbal
            || content.somatic
            || content.material
            || content.ritual
            || content.duration
            || content.concentration"
        class="my-2"
      />

      <p
        v-if="content.castingTime"
        class="mt-1 text-muted-foreground"
      >
        <span class="font-bold text-foreground">Casting time:</span> {{ content.castingTime }}
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
        v-if="content.rangeText"
        class="mt-1 text-muted-foreground"
      >
        <span class="font-bold text-foreground">Range:</span> {{ content.rangeText }}
      </p>
      <p
        v-if="content.verbal || content.somatic || content.material"
        class="mt-1 text-muted-foreground"
      >
        <span class="font-bold text-foreground">Components:</span> {{ [content.verbal ? 'V' : '', content.somatic ? 'S' : '', content.material ? 'M' : ''].filter(Boolean).join(', ') }}{{ content.materialSpecified ? ` (${content.materialSpecified})` : '' }}
      </p>
      <p
        v-if="content.ritual"
        class="mt-1 text-muted-foreground"
      >
        <span class="font-bold text-foreground">Ritual:</span> {{ $t('general.yes') }}
      </p>

      <UiSeparator
        v-if="
          content.targetType
            || content.targetCount
            || content.shapeType
            || content.shapeSize"
        class="my-2"
      />

      <p
        v-if="content.targetType"
        class="mt-1 text-muted-foreground"
      >
        <span class="font-bold text-foreground">Target type:</span> {{ content.targetType }}
      </p>
      <p
        v-if="content.targetCount"
        class="mt-1 text-muted-foreground"
      >
        <span class="font-bold text-foreground">Target count:</span> {{ content.targetCount }}
      </p>
      <p
        v-if="content.shapeType"
        class="mt-1 text-muted-foreground"
      >
        <span class="font-bold text-foreground">Shape type:</span> {{ content.shapeType }}
      </p>
      <p
        v-if="content.shapeSize"
        class="mt-1 text-muted-foreground"
      >
        <span class="font-bold text-foreground">Shape size:</span> {{ content.shapeSize }}
      </p>

      <UiSeparator
        v-if="
          content.attackRoll !== undefined
            || content.damageRoll
            || (content.damageTypes && content.damageTypes.length)
            || content.savingThrowAbility"
        class="my-2"
      />

      <p
        v-if="content.attackRoll !== undefined"
        class="mt-1 text-muted-foreground"
      >
        <span class="font-bold text-foreground">Attack roll:</span> {{ content.attackRoll ? $t('general.yes') : $t('general.no') }}
      </p>
      <p
        v-if="content.damageRoll"
        class="mt-1 text-muted-foreground"
      >
        <span class="font-bold text-foreground">Damage roll:</span> {{ content.damageRoll }}
      </p>
      <p
        v-if="content.damageTypes?.length"
        class="mt-1 text-muted-foreground"
      >
        <span class="font-bold text-foreground">Damage types:</span> {{ content.damageTypes.join(', ') }}
      </p>
      <p
        v-if="content.savingThrowAbility"
        class="mt-1 text-muted-foreground"
      >
        <span class="font-bold text-foreground">Saving throw:</span> {{ content.savingThrowAbility }}
      </p>

      <UiSeparator
        v-if="
          content.reactionCondition
            || content.materialCost
            || content.materialConsumed !== undefined"
        class="my-2"
      />

      <p
        v-if="content.reactionCondition"
        class="mt-1 text-muted-foreground"
      >
        <span class="font-bold text-foreground">Reaction condition:</span> {{ content.reactionCondition }}
      </p>
      <p
        v-if="content.materialCost"
        class="mt-1 text-muted-foreground"
      >
        <span class="font-bold text-foreground">Material cost:</span> {{ content.materialCost }}
      </p>
      <p
        v-if="content.materialConsumed !== undefined"
        class="mt-1 text-muted-foreground"
      >
        <span class="font-bold text-foreground">Material consumed:</span> {{ content.materialConsumed ? $t('general.yes') : $t('general.no') }}
      </p>
    </template>
  </div>
</template>
