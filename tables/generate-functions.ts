import { Tippy } from 'vue-tippy'
import type { BouncerAbility } from 'nuxt-authorization/utils'
import { Icon, NuxtLinkLocale, Can } from '#components'
import { Checkbox } from '~/components/ui/checkbox'

export function iconButton(
  icon: string,
  content: string,
  color: Color,
  cb: () => void,
): VNode {
  return h(Tippy, { content },
    h('button', {
      tippy: content,
      ariaLabel: content,
      class: `icon-btn-${color}`,
      onClick: cb,
    }, h(Icon, {
      name: icon,
      class: 'size-5',
      ariaHidden: true,
    })),
  )
}

export function linkButton(to: string, content: string): VNode {
  return h(NuxtLinkLocale, {
    to,
    class: 'underline underline-offset-2 decoration-primary',
    ariaLabel: content,
  }, content)
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
  }, children)
}
