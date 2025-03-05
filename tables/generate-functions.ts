import { Tippy } from 'vue-tippy'
import type { BouncerAbility } from 'nuxt-authorization/utils'
import { Icon, NuxtLinkLocale, Can, Card } from '#components'
import { Checkbox } from '~/components/ui/checkbox'

export function iconElement(icon: string, color?: string, size?: string): VNode {
  return h(Icon, {
    name: icon,
    class: `${color} ${size || 'size-5'}`,
    ariaHidden: true,
  })
}

export function iconLabelElement(
  icon: string,
  label: string,
  tooltip: string,
  color?: string,
  size?: string,
): VNode {
  return h(Tippy, {
    class: 'flex items-center gap-2',
    content: tooltip,
  }, () => [
    iconElement(icon, color, size),
    h('span', label),
  ])
}

export function iconButton(
  icon: string,
  content: string,
  color: Color,
  cb: () => void,
  disabled = false,
): VNode {
  return h(Tippy, { content },
    () => h('button', {
      tippy: content,
      ariaLabel: content,
      class: `icon-btn-${color}`,
      onClick: cb,
      disabled,
    }, iconElement(icon)),
  )
}

export function iconLink(
  icon: string,
  content: string,
  color: Color,
  to: string,
  external = false,
): VNode {
  return h(Tippy, { content },
    () => h(NuxtLinkLocale, {
      to,
      class: `icon-btn-${color}`,
      ariaLabel: content,
      target: external ? '_blank' : undefined,
    }, () => iconElement(icon)),
  )
}

export function linkButton(
  to: string,
  content: string | VNode,
  external = false,
  style?: string,
): VNode {
  return h(NuxtLinkLocale, {
    to,
    class: style ?? 'underline underline-offset-2 decoration-primary',
    ariaLabel: typeof content === 'string' ? content : '',
    target: external ? '_blank' : undefined,
  }, typeof content === 'string' ? () => content : content)
}

export function selectButton(
  checked: boolean,
  cb: (event: unknown) => void,
  disabled: boolean = false,
): VNode {
  return h(Checkbox, {
    checked: checked,
    disabled,
    onClick: (event: unknown) => cb(event),
  })
}

export function expandButton(
  content: string,
  expanded: boolean,
  cb: (event: unknown) => void,
): VNode {
  return h(Tippy, { content },
    () => h('button', {
      ariaLabel: content,
      class: expanded ? 'icon-btn-destructive' : 'icon-btn-help',
      onClick: cb,
    }, h(Icon, {
      name: 'tabler:chevron-right',
      class: `size-5 transition-transform duration-200 ease-in-out ${expanded ? 'rotate-90' : ''}`,
      ariaHidden: true,
    }),
    ),
  )
}

export function permission(
  ability: BouncerAbility<AuthUser> | BouncerAbility<AuthUser>[],
  args: unknown[] | unknown[][],
  children: VNode[] | VNode,
  style?: string,
  as?: string,
): VNode {
  return h(Can, {
    ability,
    args,
    class: style ?? 'flex items-center',
    as: as ?? 'div',
  }, () => children)
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
              h('span', { class: 'body-small text-muted-foreground' }, action.desc),
            ]),
            (action.attack_bonus || action.damage_dice) && h('div', {
              class: 'flex flex-wrap gap-x-4 items-center mt-2',
            }, [
              action.attack_bonus && h('div', {
                class: 'flex flex-wrap gap-x-2 items-center',
              }, [
                h('span', {}, 'To hit:'),
                h('span', { class: 'body-small text-muted-foreground' }, `+${action.attack_bonus}`),
              ]),
              action.damage_dice && h('div', {
                class: 'flex flex-wrap gap-x-2 items-center',
              }, [
                h('span', {}, 'Dice:'),
                h('span', { class: 'body-small text-muted-foreground' }, [
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
    : h('p', { class: 'body-small text-muted-foreground' }, t('components.encounterTable.noActions'))
}

export function homebrewTag(type: HomebrewType): VNode {
  const { t } = useI18n()

  return h('div', {
    class: 'text-xs bg-muted py-[2px] px-2 rounded-full w-fit flex items-center gap-2',
  }, [
    iconElement(homebrewIcon(type), homebrewColor(type), 'size-4 min-w-4'),
    h('span', t(`general.${type}`)),
  ])
}
