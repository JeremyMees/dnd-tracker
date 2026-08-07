export const nuxtLayoutStub = {
  props: ['name', 'header'],
  setup: () => ({ toggleSidebar: () => {} }),
  template: `
    <div :test-id="name">
      <slot name="header" />
      <slot />
      <slot name="footer" />
      <slot name="right" />
      <slot
        name="sidebar-content"
        :is-expanded="true"
        :toggle-sidebar="toggleSidebar"
      />
    </div>
  `,
}
