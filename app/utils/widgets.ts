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
}

export type Tree = (Category & {
  widgets: Widget[]
})[]

type CategoryIndex = typeof categories[number]['name']

export const categories = [
  {
    icon: 'mdi:hexadecimal',
    name: 'Device parsers',
    description: 'Parsers to decode data from devices and encode data to devices. Build upon WIKA\'s javascript parser library',
    to: '/parsers',
  },
  /* {
    icon: 'mdi:battery-medium',
    name: 'Battery calculation',
    description: 'Widgets for the settings page',
  }, */
] as const satisfies Category[]

export const widgets: Widget[] = [
  {
    id: '1',
    img: '/NETRIS2.png',
    name: 'NETRIS2',
    description: 'Decode data from and encode data to NETRIS2 devices',
    tags: ['NETRIS2', 'LoRa'],
    category: 'Device parsers',
    to: '/parsers/netris2',
  },
  /* {
    id: '2',
    img: '/NETRIS2.png',
    name: 'NETRIS2 CIOT',
    description: 'Calculate the remaining battery life of a NETRIS2 CIOT device',
    tags: ['netris2', 'LoRa'],
    category: 'Battery calculation',
    to: '/netris2-battery-calculation',
  },
  {
    id: '3',
    img: '/PEW.png',
    name: 'PEW',
    description: 'Decode data from and encode data to PEW devices',
    tags: ['pew', 'LoRa'],
    category: 'Device parsers',
    to: '/pew-parser',
  }, */
]

export function getCategoryFromPath(path: string): Category | null {
  const pathFragment = path.split('/').filter(Boolean)
  const categoryName = `/${pathFragment[0]}` // Assuming the first segment is the category
  const found = categories.find(category => category.to === categoryName) ?? null
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

export const tree = treeFromWidgets(widgets)
