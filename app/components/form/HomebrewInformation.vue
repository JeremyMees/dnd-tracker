<script setup lang="ts">
import { speedTypes, speedMap, sightRangeMap } from '~~/constants/dnd'

const props = defineProps<{
  type?: string
  sheet?: InitiativeSheet
}>()

const summonersOptions = computed<Option<string>[]>(() => {
  if (props.sheet?.rows) {
    return props.sheet.rows
      .filter(r => r.type !== 'summon')
      .map(o => ({ label: o.name, value: o.id }))
  }
  else return []
})
</script>

<template>
  <div :class="{ 'grid sm:grid-cols-2 gap-x-3': (type === 'monster' || type === 'summon') && sheet }">
    <UiFormField
      v-slot="{ componentField }"
      name="type"
    >
      <UiFormItem>
        <UiFormLabel required>
          {{ $t('components.inputs.typeLabel') }}
        </UiFormLabel>
        <UiSelect v-bind="componentField">
          <UiFormControl>
            <UiSelectTrigger>
              <UiSelectValue :placeholder="$t('components.inputs.nothing')" />
            </UiSelectTrigger>
          </UiFormControl>
          <UiSelectContent>
            <UiSelectGroup>
              <UiSelectItem
                v-for="option in [
                  { label: $t('general.player'), value: 'player' },
                  { label: $t('general.summon'), value: 'summon' },
                  { label: $t('general.npc'), value: 'npc' },
                  { label: $t('general.monster'), value: 'monster' },
                  { label: $t('general.lair'), value: 'lair' },
                ]"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </UiSelectItem>
            </UiSelectGroup>
          </UiSelectContent>
        </UiSelect>
        <UiFormMessage />
      </UiFormItem>
    </UiFormField>
    <UiFormField
      v-if="(type === 'monster' || type === 'summon') && sheet"
      v-slot="{ componentField }"
      name="amount"
    >
      <UiFormItem v-auto-animate>
        <UiFormLabel required>
          {{ $t('components.inputs.amountLabel') }}
        </UiFormLabel>
        <UiFormControl>
          <UiInput
            type="number"
            v-bind="componentField"
          />
        </UiFormControl>
        <UiFormMessage />
      </UiFormItem>
    </UiFormField>
  </div>
  <UiFormField
    v-if="type === 'summon' && sheet"
    v-slot="{ componentField }"
    name="summoner"
  >
    <UiFormItem>
      <UiFormLabel required>
        {{ $t('components.inputs.summonerLabel') }}
      </UiFormLabel>
      <UiSelect v-bind="componentField">
        <UiFormControl>
          <UiSelectTrigger>
            <UiSelectValue :placeholder="$t('components.inputs.nothing')" />
          </UiSelectTrigger>
        </UiFormControl>
        <UiSelectContent>
          <UiSelectGroup>
            <UiSelectItem
              v-for="option in summonersOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </UiSelectItem>
          </UiSelectGroup>
        </UiSelectContent>
      </UiSelect>
      <UiFormMessage />
    </UiFormItem>
  </UiFormField>
  <div :class="{ 'grid sm:grid-cols-2 gap-x-3': type === 'player' && !sheet }">
    <UiFormField
      v-slot="{ componentField, setValue }"
      name="name"
    >
      <UiFormItem v-auto-animate>
        <UiFormLabel required>
          {{ $t('components.inputs.nameLabel') }}
        </UiFormLabel>
        <UiFormControl>
          <UiInputGroup>
            <UiInputGroupInput
              type="text"
              v-bind="componentField"
            />
            <UiInputGroupAddon
              align="inline-end"
              class="has-[>button]:mr-0 pr-2"
            >
              <UiInputGroupButton
                :aria-label="$t('actions.generateName')"
                @click="setValue(randomName())"
              >
                <Icon name="tabler:arrows-shuffle-2" />
              </UiInputGroupButton>
            </UiInputGroupAddon>
          </UiInputGroup>
        </UiFormControl>
        <UiFormMessage />
      </UiFormItem>
    </UiFormField>
    <UiFormField
      v-if="type === 'player' && !sheet"
      v-slot="{ componentField }"
      name="player"
    >
      <UiFormItem v-auto-animate>
        <UiFormLabel>
          {{ $t('components.inputs.playerLabel') }}
        </UiFormLabel>
        <UiFormControl>
          <UiInput
            type="text"
            v-bind="componentField"
          />
        </UiFormControl>
        <UiFormMessage />
      </UiFormItem>
    </UiFormField>
  </div>
  <div :class="{ 'grid sm:grid-cols-2 gap-x-3': sheet }">
    <UiFormField
      v-if="sheet"
      v-slot="{ componentField, setValue }"
      name="initiative"
    >
      <UiFormItem v-auto-animate>
        <UiFormLabel>
          {{ $t('components.inputs.initiativeLabel') }}
        </UiFormLabel>
        <UiFormControl>
          <UiInputGroup>
            <UiInputGroupInput
              type="number"
              v-bind="componentField"
            />
            <UiInputGroupAddon
              align="inline-end"
              class="has-[>button]:mr-0 pr-2"
            >
              <UiInputGroupButton
                :aria-label="$t('actions.generateName')"
                @click="setValue(randomRoll(20))"
              >
                <Icon name="tabler:hexagon" />
              </UiInputGroupButton>
            </UiInputGroupAddon>
          </UiInputGroup>
        </UiFormControl>
        <UiFormMessage />
      </UiFormItem>
    </UiFormField>
    <UiFormField
      v-slot="{ componentField }"
      name="initiativeModifier"
    >
      <UiFormItem v-auto-animate>
        <UiFormLabel>
          {{ `${$t('components.inputs.initiativeLabel')} (MODIFIER)` }}
        </UiFormLabel>
        <UiFormControl>
          <UiInput
            type="number"
            v-bind="componentField"
          />
        </UiFormControl>
        <UiFormMessage />
      </UiFormItem>
    </UiFormField>
  </div>
  <div
    v-if="type !== 'lair'"
    class="grid sm:grid-cols-2 gap-x-3"
  >
    <UiFormField
      v-slot="{ componentField }"
      name="armorClass"
    >
      <UiFormItem v-auto-animate>
        <UiFormLabel>
          {{ $t('components.inputs.acLabel') }}
        </UiFormLabel>
        <UiFormControl>
          <UiInput
            type="number"
            v-bind="componentField"
          />
        </UiFormControl>
        <UiFormMessage />
      </UiFormItem>
    </UiFormField>
    <UiFormField
      v-slot="{ componentField }"
      name="hitPoints"
    >
      <UiFormItem v-auto-animate>
        <UiFormLabel>
          {{ $t('components.inputs.hpLabel') }}
        </UiFormLabel>
        <UiFormControl>
          <UiInput
            type="number"
            v-bind="componentField"
          />
        </UiFormControl>
        <UiFormMessage />
      </UiFormItem>
    </UiFormField>
  </div>

  <div
    v-if="type !== 'lair'"
    class="grid sm:grid-cols-2 gap-x-3"
  >
    <UiFormField
      v-slot="{ componentField }"
      name="hitDice"
    >
      <UiFormItem v-auto-animate>
        <UiFormLabel>
          {{ $t('components.inputs.hitDiceLabel') }}
        </UiFormLabel>
        <UiFormControl>
          <UiInput
            type="text"
            placeholder="2d6"
            v-bind="componentField"
          />
        </UiFormControl>
        <UiFormMessage />
      </UiFormItem>
    </UiFormField>
    <UiFormField
      v-slot="{ componentField }"
      name="armorDetail"
    >
      <UiFormItem v-auto-animate>
        <UiFormLabel>
          {{ $t('components.inputs.armorDetailLabel') }}
        </UiFormLabel>
        <UiFormControl>
          <UiInput
            type="text"
            v-bind="componentField"
          />
        </UiFormControl>
        <UiFormMessage />
      </UiFormItem>
    </UiFormField>
  </div>

  <div
    v-if="type !== 'lair'"
    class="grid sm:grid-cols-2 gap-x-3"
  >
    <UiFormField
      v-slot="{ componentField }"
      name="proficiencyBonus"
    >
      <UiFormItem v-auto-animate>
        <UiFormLabel>
          {{ $t('general.proficiencyBonus') }}
        </UiFormLabel>
        <UiFormControl>
          <UiInput
            type="number"
            v-bind="componentField"
          />
        </UiFormControl>
        <UiFormMessage />
      </UiFormItem>
    </UiFormField>
    <UiFormField
      v-slot="{ componentField }"
      name="passivePerception"
    >
      <UiFormItem v-auto-animate>
        <UiFormLabel>
          {{ $t('general.passivePerception') }}
        </UiFormLabel>
        <UiFormControl>
          <UiInput
            type="number"
            v-bind="componentField"
          />
        </UiFormControl>
        <UiFormMessage />
      </UiFormItem>
    </UiFormField>
  </div>

  <template v-if="type !== 'lair'">
    <UiLabel>
      {{ $t('general.speed') }}
    </UiLabel>
    <div class="rounded-md border p-3 grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-2">
      <UiFormField
        v-for="key in speedTypes.filter(k => k !== 'hover')"
        :key="key"
        v-slot="{ componentField }"
        :name="`speed.${key}`"
      >
        <UiFormItem v-auto-animate>
          <UiFormLabel>{{ speedMap[key] }}</UiFormLabel>
          <UiFormControl>
            <UiInput
              type="number"
              v-bind="componentField"
            />
          </UiFormControl>
          <UiFormMessage />
        </UiFormItem>
      </UiFormField>
      <UiFormField
        v-slot="{ value, handleChange }"
        name="speed.hover"
        type="checkbox"
      >
        <UiFormItem class="flex flex-row items-start gap-2 pb-1">
          <UiFormControl>
            <UiCheckbox
              :model-value="value"
              @update:model-value="handleChange"
            />
          </UiFormControl>
          <UiFormLabel class="mt-0.5">
            {{ speedMap.hover }}
          </UiFormLabel>
        </UiFormItem>
      </UiFormField>
    </div>
  </template>

  <template v-if="type !== 'lair'">
    <UiLabel>
      {{ $t('general.sense', 2) }}
    </UiLabel>
    <div class="rounded-md border p-3 grid sm:grid-cols-2 gap-x-3 gap-y-2">
      <UiFormField
        v-for="(label, key) in sightRangeMap"
        :key="key"
        v-slot="{ componentField }"
        :name="`sight.${key}`"
      >
        <UiFormItem v-auto-animate>
          <UiFormLabel>{{ label }}</UiFormLabel>
          <UiFormControl>
            <UiInput
              type="number"
              v-bind="componentField"
            />
          </UiFormControl>
          <UiFormMessage />
        </UiFormItem>
      </UiFormField>
    </div>
  </template>

  <div v-if="type !== 'lair'">
    <FormListInput
      name="languages"
      type="text"
      :empty="''"
      :label="$t('general.language', 2)"
      :max="20"
    />
  </div>

  <UiFormField
    v-slot="{ componentField }"
    name="link"
  >
    <UiFormItem v-auto-animate>
      <UiFormLabel>
        {{ $t('components.inputs.linkLabel') }}
      </UiFormLabel>
      <UiFormControl>
        <UiInput
          type="text"
          v-bind="componentField"
        />
      </UiFormControl>
      <UiFormMessage />
    </UiFormItem>
  </UiFormField>
</template>
