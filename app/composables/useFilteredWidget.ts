import MiniSearch from 'minisearch'

const miniSearch = new MiniSearch({
  fields: ['name', 'description', 'tags'],
  storeFields: [
    'id',
    'img',
    'name',
    'description',
    'tags',
    'category',
    'to',
  ],
})

miniSearch.addAll(widgets)

export function useFilteredWidgets(filter: MaybeRefOrGetter<string>) {
  const filteredWidgets = computed(() => {
    return miniSearch.search(toValue(filter), {
      prefix: true,
      fuzzy: 0.2,
    })
  })

  return {
    filteredWidgets: filteredWidgets as unknown as ComputedRef<Widget[]>,
  }
}
