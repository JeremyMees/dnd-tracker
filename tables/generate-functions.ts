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

const attackRoll = (attack: DndAttack, id: string) => {
  const damageDice = formatAttackDice(attack.damageDieCount, attack.damageDieType)
  const attackBonus = attack.toHitMod || undefined

  if (!attackBonus && !damageDice) return null

  return h(InitiativeActionRoll, {
    attackBonus,
    damageDice,
    damageBonus: attack.damageBonus ?? 0,
    id,
  })
}

const attackToHit = (attack: DndAttack) => {
  if (attack.toHitMod && attack.toHitMod > 0) {
    return h('div', { class: 'flex flex-wrap gap-x-2 items-center' }, [
      h('span', {}, 'To hit:'),
      h('span', { class: 'text-sm text-muted-foreground' }, `+${attack.toHitMod}`),
    ])
  }
  return null
}

const attackDamage = (attack: DndAttack) => {
  const damageDice = formatAttackDice(attack.damageDieCount, attack.damageDieType)

  return damageDice && h('div', {
    class: 'flex flex-wrap gap-x-2 items-center',
  }, [
    h('span', {}, 'Dice:'),
    h('span', { class: 'text-sm text-muted-foreground' }, [
      damageDice,
      attack.damageBonus && ` +${attack.damageBonus}`,
    ].filter(Boolean).join('')),
  ])
}

const attackSave = (attack: DndAttack) => {
  if (attack.spellSave) {
    return h('div', {
      class: 'flex flex-wrap gap-x-2 items-center',
    }, [
      h('span', {}, 'Spell save:'),
      h('span', { class: 'text-sm text-muted-foreground' }, [
        attack.spellSave,
        attack.spellSaveType,
      ].filter(Boolean).join(' ')),
    ])
  }
  else return null
}

const attackRow = (attack: DndAttack, id: string, type: 'initiative' | 'campaign') => {
  if (!attack.toHitMod && !attack.damageDieCount && !attack.spellSave) return null

  return h('div', {
    class: 'flex flex-wrap gap-x-4 items-center mt-2',
  }, [
    attack.name ? h('span', { class: 'font-semibold text-xs' }, attack.name) : null,
    type === 'initiative' ? attackRoll(attack, id) : null,
    attackToHit(attack),
    attackDamage(attack),
    attackSave(attack),
  ])
}

const generateActionsTableRow = (
  label: string,
  actionArray: DndAction[],
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
          ...action.attacks.map(attack => attackRow(attack, id, type)).filter(Boolean),
        ]),
      )),
    ),
  ])
}

const actionGroups: { actionType: DndActionType, labelKey: string }[] = [
  { actionType: 'specialAbility', labelKey: 'specialAbility' },
  { actionType: 'action', labelKey: 'action' },
  { actionType: 'bonusAction', labelKey: 'bonusAction' },
  { actionType: 'reaction', labelKey: 'reaction' },
  { actionType: 'legendaryAction', labelKey: 'legendaryAction' },
  { actionType: 'mythicAction', labelKey: 'mythicAction' },
  { actionType: 'lairAction', labelKey: 'lairAction' },
]

export function actionsTable(
  item: HomebrewItemRow | InitiativeSheetRow,
  type: 'initiative' | 'campaign',
) {
  const { t } = useI18n()

  const id = item.id as string
  const actions = item.actions ?? []

  const rows = actionGroups
    .map(({ actionType, labelKey }) => {
      const filtered = actions.filter(a => a.actionType === actionType)
      return filtered.length
        ? generateActionsTableRow(t(`general.${labelKey}`, 2), filtered, id, type)
        : ''
    })
    .filter(Boolean)

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
