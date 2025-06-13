export default defineAppConfig({
  ui: {
    button: {
      slots: {
        base: ['cursor-pointer'],
      },
    },
    navigationMenu: {
      slots: {
        link: ['cursor-pointer'],
      },
    },
    tabs: {
      slots: {
        trigger: ['cursor-pointer'],
      },
    },
    accordion: {
      slots: {
        trigger: ['cursor-pointer'],
      },
    },
  },
})
