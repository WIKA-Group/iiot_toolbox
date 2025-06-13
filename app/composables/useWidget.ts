/**
 * Get the current widget and its category from the route.
 */
export function useWidget() {
  const route = useRoute()
  const widget = computed(() => {
    return getWidgetFromPath(route.path)
  })

  const category = computed(() => {
    return getCategoryFromPath(route.path)
  })

  return {
    widget,
    category,
  }
}
