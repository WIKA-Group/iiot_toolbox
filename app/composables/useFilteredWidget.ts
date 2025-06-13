import { useFuse } from '@vueuse/integrations/useFuse'

export function useFilteredWidgets(filter: MaybeRefOrGetter<string>) {
  // Configure Fuse.js options

  const { results } = useFuse(filter, widgets, {
    matchAllWhenSearchEmpty: true,
    fuseOptions: {
      keys: ['name', 'description', 'tags'],
      threshold: 0.2,
      includeScore: false,
      includeMatches: false,
      minMatchCharLength: 1,
      shouldSort: true,
    // ...add more options if needed...
    } })

  // Map results to Widget[] (results is array of { item, ... })
  const filteredWidgets = computed(() =>
    results.value.map(r => r.item),
  )

  return {
    filteredWidgets: filteredWidgets as unknown as ComputedRef<Widget[]>,
  }
}
