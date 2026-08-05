export const nuxtLayoutStub = {
  props: ['name', 'header'],
  setup: () => ({ toggleSidebar: () => {} }),
  template: `
    <div :data-test-layout="name" :data-test-layout-header="header">
      <slot name="header" />
      <slot />
      <slot
        name="sidebar-content"
        :is-expanded="true"
        :toggle-sidebar="toggleSidebar"
      />
    </div>
  `,
}
