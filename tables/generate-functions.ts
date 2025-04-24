import { Tippy } from 'vue-tippy'
import type { BouncerAbility } from 'nuxt-authorization/utils'
import { Icon, NuxtLinkLocale, Can, Card } from '#components'
import { Checkbox } from '~/components/ui/checkbox'

export function iconElement(options: {
  icon: string
  color?: string
  size?: string
}): VNode {
  return h(Icon, {
    name: options.icon,
    class: `${options.color} ${options.size || 'size-5'}`,
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
  color: Color
  cb: () => void
  disabled?: boolean
  iconColor?: string
},
): VNode {
  return h(Tippy, { content: options.content },
    () => h('button', {
      tippy: options.content,
      ariaLabel: options.content,
      class: `icon-btn-${options.color}`,
      onClick: options.cb,
      disabled: options.disabled || false,
    }, iconElement({ icon: options.icon, color: options.iconColor })),
  )
}

export function iconLink(options: {
  icon: string
  content: string
  color: Color
  to: string
  external?: boolean
}): VNode {
  return h(Tippy, { content: options.content },
    () => h(NuxtLinkLocale, {
      to: options.to,
      class: `icon-btn-${options.color}`,
      ariaLabel: options.content,
      target: options.external ? '_blank' : undefined,
    }, () => iconElement({ icon: options.icon })),
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
  return h(Tippy, { content: options.content },
    () => h('button', {
      ariaLabel: options.content,
      class: options.expanded ? 'icon-btn-destructive' : 'icon-btn-help',
      onClick: options.cb,
    }, h(Icon, {
      name: 'tabler:chevron-right',
      class: `size-5 transition-transform duration-200 ease-in-out ${options.expanded ? 'rotate-90' : ''}`,
      ariaHidden: true,
    }),
    ),
  )
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

export function actionsTable(item: HomebrewItemRow | InitiativeSheetRow) {
  const { t } = useI18n()

  const generateRow = (label: string, actionArray: (Action | ActionOpen5E)[]) => {
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
            (action.attack_bonus || action.damage_dice) && h('div', {
              class: 'flex flex-wrap gap-x-4 items-center mt-2',
            }, [
              action.attack_bonus && h('div', {
                class: 'flex flex-wrap gap-x-2 items-center',
              }, [
                h('span', {}, 'To hit:'),
                h('span', { class: 'text-sm text-muted-foreground' }, `+${action.attack_bonus}`),
              ]),
              action.damage_dice && h('div', {
                class: 'flex flex-wrap gap-x-2 items-center',
              }, [
                h('span', {}, 'Dice:'),
                h('span', { class: 'text-sm text-muted-foreground' }, [
                  action.damage_dice,
                  action.damage_bonus && ` +${action.damage_bonus}`,
                ].filter(Boolean).join('')),
              ]),
            ]),
          ]),
        )),
      ),
    ])
  }

  const rows = [
    item.actions?.length ? generateRow(t('general.action', 2), item.actions) : '',
    item.reactions?.length ? generateRow(t('general.reaction', 2), item.reactions) : '',
    item.legendary_actions?.length ? generateRow(t('general.legendaryAction', 2), item.legendary_actions) : '',
    item.special_abilities?.length ? generateRow(t('general.specialAbility', 2), item.special_abilities) : '',
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
