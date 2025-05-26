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
}

export type Tree = (Category & {
  widgets: Widget[]
})[]

type CategoryIndex = typeof categories[number]['name']

export const categories = [
  /* {
    icon: 'mdi:hexadecimal',
    name: 'Device parsers',
    description: 'Parsers to decode data from devices and encode data to devices. Build upon WIKA\'s javascript parser library',
  },
  {
    icon: 'mdi:battery-medium',
    name: 'Battery calculation',
    description: 'Widgets for the settings page',
  }, */
] as const satisfies Category[]

export const widgets: Widget[] = [
  /* {
    id: '1',
    img: '/Netris2.png',
    name: 'Netris2',
    description: 'Decode data from and encode data to Netris2 devices',
    tags: ['netris2', 'LoRa'],
    category: 'Device parsers',
    to: '/netris2-parser',
  }, */
  /* {
    id: '2',
    img: '/Netris2.png',
    name: 'Netris2 CIOT',
    description: 'Calculate the remaining battery life of a Netris2 CIOT device',
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

export function getCategoryFromWidgetOrIndex(
  widget: Widget | CategoryIndex,
): Category {
  if (typeof widget === 'string') {
    // @ts-expect-error - is currently empty
    return categories.find(category => category.name === widget)!
  }
  // @ts-expect-error - is currently empty
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
