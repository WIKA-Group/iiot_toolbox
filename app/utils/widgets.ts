export type Widget = {
  id: string
  img?: string
  name: string
  description: string
  tags: string[]
  category: CategoryIndex
  to: `/${string}`
}

export type Category = {
  icon: string
  name: string
  description: string

  to: `/${string}`

  pathPrefix?: `/${string}`
}

export type Tree = (Category & {
  widgets: Widget[]
})[]

type CategoryIndex = typeof categories[number]['name']

export const categories = [
  {
    icon: 'mdi:hexadecimal',
    name: 'Device parsers',
    description: 'Parsers to decode data from devices and encode data to devices. Built upon WIKA\'s javascript parser library',
    to: '/',
    pathPrefix: '/parsers',
  },
] as const satisfies Category[]

const deviceWidgets: Widget[] = deviceList.map(device => ({
  id: device.slug,
  img: device.img,
  name: device.label,
  description: device.description,
  tags: device.tags,
  category: 'Device parsers',
  to: `/parsers/${device.slug}`,

}))

export const widgets: Widget[] = [
  ...deviceWidgets,
]

export function getCategoryFromPath(path: string): Category | null {
  const pathFragment = path.split('/').filter(Boolean)
  const categoryName = `/${pathFragment[0]}` // Assuming the first segment is the category

  const found = categories.find(category => (category.pathPrefix ?? category.to) === categoryName) ?? null
  return found
}

export function getWidgetFromPath(path: string): Widget | null {
  const found = widgets.find(widget => widget.to === path) ?? null
  return found
}

export function getCategoryFromWidgetOrIndex(
  widget: Widget | CategoryIndex,
): Category {
  if (typeof widget === 'string') {
    return categories.find(category => category.name === widget)!
  }
  return categories.find(category => category.name === widget.category)!
}

export function treeFromWidgets(
  widgets: Widget[],
): Tree {
  return widgets.reduce((acc, widget) => {
    const category = acc.find(cat => cat.name === widget.category)
    if (category) {
      category.widgets.push(widget)
    }
    else {
      const category = getCategoryFromWidgetOrIndex(widget)
      acc.push({
        ...category,
        widgets: [widget],
      })
    }
    return acc
  }, [] as Tree)
}
