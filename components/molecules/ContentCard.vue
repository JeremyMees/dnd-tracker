<script setup lang="ts">
defineEmits<{ pin: [], unpin: [] }>()

const props = withDefaults(
  defineProps<{
    hit: InfoCard
    type: Open5eType
    pinned?: boolean
    allowPin?: boolean
  }>(), {
    pinned: false,
    allowPin: false,
  },
)

const { $md } = useNuxtApp()

const isOpen = ref<boolean>(false)

function hideOpenButton(): boolean {
  return props.type === 'weapons' || props.type === 'armor'
}
</script>

<template>
  <UiCard
    class="relative"
    @dblclick="isOpen = !isOpen"
  >
    <UiCardHeader>
      <button
        v-if="allowPin"
        v-tippy="{
          content: $t(`components.infoCard.${pinned ? 'remove' : 'add'}`),
          placement: 'left',
        }"
        class="absolute right-4 top-4"
        @click="pinned ? $emit('unpin') : $emit('pin')"
      >
        <Icon
          :name="pinned ? 'tabler:pinned-off' : 'tabler:pin'"
          class="size-4 min-w-4"
          :class="[pinned ? 'text-destructive' : 'text-warning']"
          aria-hidden="true"
        />
      </button>
      <UiCardTitle>{{ hit.name }}</UiCardTitle>
    </UiCardHeader>
    <UiCardContent>
      <div
        v-if="hit.desc"
        class="md-richtext text-muted-foreground"
        :class="{
          'line-clamp-3': !isOpen && hideOpenButton,
          'border-b-4 pb-1 border-background': isOpen && ['spells', 'magicitems'].includes(type),
        }"
        v-html="$md.render(hit.desc)"
      />
      <template v-if="isOpen || hideOpenButton()">
        <p
          v-if="hit.category"
          class="mt-4"
        >
          <span class="font-bold text-foreground">Category:</span> {{ hit.category }}
        </p>
        <p
          v-if="hit.ac_string"
          class="mt-1 text-muted-foreground"
        >
          <span class="font-bold text-foreground">AC:</span> {{ hit.ac_string }}
        </p>
        <p
          v-if="hit.strength_requirement"
          class="mt-1 text-muted-foreground"
        >
          <span class="font-bold text-foreground">Strength requirement:</span> {{ hit.strength_requirement }}
        </p>
        <p
          v-if="hit.stealth_disadvantage"
          class="mt-1 text-muted-foreground font-bold"
        >
          Stealth disadvantage
        </p>
        <p
          v-if="hit.cost"
          class="mt-1 text-muted-foreground"
        >
          <span class="font-bold text-foreground">Cost:</span> {{ hit.cost }}
        </p>
        <p
          v-if="hit.damage_dice"
          class="mt-1 text-muted-foreground"
        >
          <span class="font-bold text-foreground">Damage dice:</span> {{ hit.damage_dice }}
        </p>
        <p
          v-if="hit.damage_type"
          class="mt-1 text-muted-foreground"
        >
          <span class="font-bold text-foreground">Damage type:</span> {{ hit.damage_type }}
        </p>
        <p
          v-if="hit.weight"
          class="mt-1 text-muted-foreground"
        >
          <span class="font-bold text-foreground">Weight:</span> {{ hit.weight }}
        </p>
        <div
          v-if="hit.properties"
          class="mt-1 text-muted-foreground"
        >
          <p class="font-bold">
            Properties
          </p>
          <ul class="list-disc list-outside ml-5 mb-5">
            <li
              v-for="property in hit.properties"
              :key="property"
            >
              {{ property }}
            </li>
          </ul>
        </div>
        <p
          v-if="hit.type"
          class="mt-4"
        >
          <span class="font-bold text-foreground">Type:</span> {{ hit.type }}
        </p>
        <p
          v-if="hit.rarity"
          class="mt-1 text-muted-foreground"
        >
          <span class="font-bold text-foreground">Rarity:</span> {{ hit.rarity }}
        </p>
        <p
          v-if="hit.requires_attunement"
          class="mt-1 text-muted-foreground font-bold"
        >
          Requires attunement
        </p>
        <p
          v-if="hit.skill_proficiencies"
          class="mt-4"
        >
          <span class="font-bold text-foreground">Skill proficiencies:</span> {{ hit.skill_proficiencies }}
        </p>
        <p
          v-if="hit.tool_proficiencies"
          class="mt-1 text-muted-foreground"
        >
          <span class="font-bold text-foreground">Tool proficiencies:</span> {{ hit.tool_proficiencies }}
        </p>
        <p
          v-if="hit.languages"
          class="mt-1 text-muted-foreground"
        >
          <span class="font-bold text-foreground">Languages:</span> {{ hit.languages }}
        </p>
        <p
          v-if="hit.equipment"
          class="mt-1 text-muted-foreground"
        >
          <span class="font-bold text-foreground">Equipment:</span> {{ hit.equipment }}
        </p>
        <p
          v-if="hit.feature"
          class="mt-4 font-bold"
        >
          {{ hit.feature }}
        </p>
        <p
          v-if="hit.feature_desc"
          class="mt-1 text-muted-foreground"
        >
          {{ hit.feature_desc }}
        </p>
        <p
          v-if="hit.level"
          class="mt-4"
        >
          <span class="font-bold text-foreground">Level:</span> {{ hit.level }}
        </p>
        <p
          v-if="hit.higher_level"
          class="mt-1 text-muted-foreground"
        >
          <span class="font-bold text-foreground">Higher level:</span> {{ hit.higher_level }}
        </p>
        <p
          v-if="hit.casting_time"
          class="mt-1 text-muted-foreground"
        >
          <span class="font-bold text-foreground">Casting time:</span> {{ hit.casting_time }}
        </p>
        <p
          v-if="hit.range"
          class="mt-1 text-muted-foreground"
        >
          <span class="font-bold text-foreground">Range:</span> {{ hit.range }}
        </p>
        <p
          v-if="hit.duration"
          class="mt-1 text-muted-foreground"
        >
          <span class="font-bold text-foreground">Duration:</span>
          {{ hit.duration }}
        </p>
        <p
          v-if="hit.concentration"
          class="mt-1 text-muted-foreground"
        >
          <span class="font-bold text-foreground">Concentration:</span>
          {{ hit.concentration }}
        </p>
        <p
          v-if="hit.ritual"
          class="mt-1 text-muted-foreground"
        >
          <span class="font-bold text-foreground">Ritual:</span>
          {{ hit.ritual }}
          <span class="ml-2 body-extra-small">can be cast as ritual</span>
        </p>
        <p
          v-if="hit.components"
          class="mt-1 text-muted-foreground"
        >
          <span class="font-bold text-foreground">Components:</span> {{ hit.components }}
        </p>
        <p
          v-if="hit.material"
          class="mt-1 text-muted-foreground"
        >
          <span class="font-bold text-foreground">Material:</span> {{ hit.material }}
        </p>
        <p
          v-if="hit.school"
          class="mt-1 text-muted-foreground"
        >
          <span class="font-bold text-foreground">School:</span> {{ hit.school }}
        </p>
        <p
          v-if="hit.dnd_class"
          class="mt-1 text-muted-foreground"
        >
          <span class="font-bold text-foreground">Classes that can use this spell:</span> {{ hit.dnd_class }}
        </p>
        <div
          v-if="hit.prerequisite"
          class="mt-4"
        >
          <p class="font-bold">
            Prerequisite
          </p>
          <p>
            {{ hit.prerequisite }}
          </p>
        </div>
        <div
          v-if="hit.effects_desc?.length"
          class="mt-4"
        >
          <p class="font-bold">
            Effects
          </p>
          <ul class="list-disc list-outside ml-5 mb-5">
            <li
              v-for="effect in hit.effects_desc"
              :key="effect"
            >
              {{ effect }}
            </li>
          </ul>
        </div>
      </template>
    </UiCardContent>
    <UiCardFooter>
      <div
        v-if="!hideOpenButton()"
        class="flex justify-end w-full"
      >
        <button
          class="flex gap-2 text-foreground"
          :aria-label="$t(`actions.read${isOpen ? 'Less' : 'More'}`)"
          @click="isOpen = !isOpen"
        >
          <p>
            {{ $t(`actions.read${isOpen ? 'Less' : 'More'}`) }}
          </p>
          <Icon
            name="tabler:chevron-down"
            class="duration-200 size-6 stroke-2"
            :class="{ 'rotate-180': isOpen }"
            aria-hidden="true"
          />
        </button>
      </div>
    </UiCardFooter>
  </UiCard>
</template>
