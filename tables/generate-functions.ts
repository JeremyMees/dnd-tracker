import { Tippy } from 'vue-tippy'
import type { BouncerAbility } from 'nuxt-authorization/utils'
import { Icon, NuxtLinkLocale, Can, Card, InitiativeActionRoll } from '#components'
import { Checkbox } from '~/components/ui/checkbox'
import { Button, type ButtonVariants } from '~/components/ui/button'
import { Kbd, KbdGroup } from '~/components/ui/kbd'

export function iconElement(options: {
  icon: string
  color?: string
  size?: string
}): VNode {
  return h(Icon, {
    name: options.icon,
    class: `${options.color} ${options.size || 'size-3'}`,
    ariaHidden: true,
  })
}

export function iconLabelElement(options: {
  icon: string
  label: string
  tooltip: string
  color?: string
  size?: string
}): VNode {
  return h(Tippy, {
    class: 'flex items-center gap-2',
    content: options.tooltip,
  }, () => [
    iconElement(options),
    h('span', options.label),
  ])
}

export function iconButton(options: {
  icon: string
  content: string
  variant: ButtonVariants['variant']
  cb: () => void
  disabled?: boolean
  iconColor?: string
},
): VNode {
  return h(Tippy, { content: options.content },
    () => h(Button, {
      tippy: options.content,
      ariaLabel: options.content,
      onClick: options.cb,
      disabled: options.disabled || false,
      variant: options.variant,
      size: 'icon-sm',
    }, () => iconElement({ icon: options.icon })),
  )
}

export function iconLink(options: {
  icon: string
  content: string
  variant: ButtonVariants['variant']
  to: string
  external?: boolean
}): VNode {
  return h(Tippy, { content: options.content },
    () => h(Button, {
      asChild: true,
      variant: options.variant,
      size: 'icon-sm',
    },
    () => h(NuxtLinkLocale, {
      to: options.to,
      ariaLabel: options.content,
      target: options.external ? '_blank' : undefined,
    }, () => iconElement({ icon: options.icon }))),
  )
}

export function linkButton(options: {
  to: string
  content: string | VNode
  external?: boolean
  style?: string
}): VNode {
  return h(NuxtLinkLocale, {
    to: options.to,
    class: options.style ?? 'underline underline-offset-2 decoration-primary',
    ariaLabel: typeof options.content === 'string' ? options.content : '',
    target: options.external ? '_blank' : undefined,
  }, typeof options.content === 'string' ? () => options.content : options.content)
}

export function selectButton(options: {
  checked: boolean
  cb: (event: unknown) => void
  disabled?: boolean
}): VNode {
  return h(Checkbox, {
    modelValue: options.checked,
    disabled: options.disabled || false,
    onClick: options.cb,
  })
}

export function expandButton(options: {
  content: string
  expanded: boolean
  cb: (event: unknown) => void
}): VNode {
  return h(Tippy, {
    allowHTML: true,
  }, {
    default: () => h(Button, {
      ariaLabel: options.content,
      variant: 'default-ghost',
      size: 'icon-sm',
      onClick: options.cb,
    }, () => h(Icon, {
      name: 'tabler:chevron-right',
      class: 'transition-transform duration-200 ease-in-out',
      style: {
        transform: options.expanded ? 'rotate(90deg)' : 'rotate(0deg)',
      },
      ariaHidden: true,
    })),
    content: () => h('div', { class: 'flex gap-2' }, [
      options.content,
      h(KbdGroup, () => [
        h(Kbd, () => 'MOD'),
        h('span', { class: 'text-muted-foreground' }, '+'),
        h(Kbd, () => '⏎'),
      ]),
    ]),
  })
}

export function permission(options: {
  ability: BouncerAbility<AuthUser> | BouncerAbility<AuthUser>[]
  args: unknown[] | unknown[][]
  children: VNode[] | VNode
  style?: string
  as?: string
}): VNode {
  return h(Can, {
    ability: options.ability,
    args: options.args,
    class: options.style ?? 'flex items-center',
    as: options.as ?? 'div',
  }, () => options.children)
}

const actionRoll = (action: Action | ActionOpen5E, id: string) => {
  const attackBonus = action.attack_bonus
  const damageDice = action.damage_dice
  const damageBonus = action.damage_bonus ?? 0

  if (!attackBonus && !damageDice) return null

  return h(InitiativeActionRoll, {
    attackBonus,
    damageDice,
    damageBonus,
    id,
  })
}

const actionToHit = (action: Action | ActionOpen5E) => {
  if (action.attack_bonus && action.attack_bonus > 0) {
    return h('div', { class: 'flex flex-wrap gap-x-2 items-center' }, [
      h('span', {}, 'To hit:'),
      h('span', { class: 'text-sm text-muted-foreground' }, `+${action.attack_bonus}`),
    ])
  }
  return null
}

const actionDamage = (action: Action | ActionOpen5E) => {
  return action.damage_dice && h('div', {
    class: 'flex flex-wrap gap-x-2 items-center',
  }, [
    h('span', {}, 'Dice:'),
    h('span', { class: 'text-sm text-muted-foreground' }, [
      action.damage_dice,
      action.damage_bonus && ` +${action.damage_bonus}`,
    ].filter(Boolean).join('')),
  ])
}

const actionSave = (action: Action | ActionOpen5E) => {
  if ('spell_save' in action && action.spell_save) {
    return h('div', {
      class: 'flex flex-wrap gap-x-2 items-center',
    }, [
      h('span', {}, 'Spell save:'),
      h('span', { class: 'text-sm text-muted-foreground' }, [
        action.spell_save,
        action.spell_save_type,
      ].filter(Boolean).join(' ')),
    ])
  }
  else return null
}

const generateActionsTableRow = (
  label: string,
  actionArray: (Action | ActionOpen5E)[],
  id: string,
  type: 'initiative' | 'campaign',
) => {
  return h('div', { class: 'flex flex-col gap-2' }, [
    h('p', { class: 'head-3' }, label),
    h(Card, {
      class: 'p-2',
      color: 'secondary',
    }, () =>
      h('div', {}, actionArray.map(action =>
        h('ul', {
          class: 'flex w-full flex-col border-b-2 border-secondary py-2 last:border-b-0 last:pb-0 first:pt-0 list-disc',
        }, [
          h('li', { class: 'flex flex-wrap gap-x-4 items-center' }, [
            h('span', {}, action.name + ':'),
            h('span', { class: 'text-sm text-muted-foreground' }, action.desc),
          ]),
          (
            action.attack_bonus
            || action.damage_dice
            || ('spell_save' in action && action.spell_save)
          ) && h('div', {
            class: 'flex flex-wrap gap-x-4 items-center mt-2',
          }, [
            type === 'initiative' ? actionRoll(action, id) : null,
            actionToHit(action),
            actionDamage(action),
            actionSave(action),
          ]),
        ]),
      )),
    ),
  ])
}

export function actionsTable(
  item: HomebrewItemRow | InitiativeSheetRow,
  type: 'initiative' | 'campaign',
) {
  const { t } = useI18n()

  const id = item.id as string
  const actions = item.actions
  const reactions = item.reactions
  const legendary = item.legendary_actions
  const special = item.special_abilities

  const rows = [
    actions?.length ? generateActionsTableRow(t('general.action', 2), actions, id, type) : '',
    reactions?.length ? generateActionsTableRow(t('general.reaction', 2), reactions, id, type) : '',
    legendary?.length ? generateActionsTableRow(t('general.legendaryAction', 2), legendary, id, type) : '',
    special?.length ? generateActionsTableRow(t('general.specialAbility', 2), special, id, type) : '',
  ].filter(Boolean)

  return rows.length
    ? h('div', { class: 'space-y-4' }, rows)
    : h('p', { class: 'text-sm text-muted-foreground' }, t('components.encounterTable.noActions'))
}

export function homebrewTag(type: HomebrewType): VNode {
  const { t } = useI18n()

  return h('div', {
    class: 'text-xs bg-muted py-[2px] px-2 rounded-full w-fit h-fit flex items-center gap-2',
  }, [
    iconElement({ icon: homebrewIcon(type), color: homebrewColor(type), size: 'size-4 min-w-4' }),
    h('span', t(`general.${type}`)),
  ])
}
