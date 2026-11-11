export default defineAppConfig({
  ui: {
    button: {
      slots: {
        base: ['cursor-pointer'],
      },
    },
    // Touch screens get the 44 px minimum target; desktop keeps the compact size.
    input: {
      slots: {
        base: ['[@media(pointer:coarse)]:min-h-11'],
      },
    },
    select: {
      slots: {
        base: ['[@media(pointer:coarse)]:min-h-11'],
      },
    },
    selectMenu: {
      slots: {
        base: ['[@media(pointer:coarse)]:min-h-11'],
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
